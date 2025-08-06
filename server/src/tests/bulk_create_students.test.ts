import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type BulkCreateStudentsInput } from '../schema';
import { bulkCreateStudents } from '../handlers/bulk_create_students';
import { eq } from 'drizzle-orm';

const testInput: BulkCreateStudentsInput = {
  students: [
    {
      student_id: 'S001',
      full_name: 'John Doe',
      class: '10A',
      grade_level: 10
    },
    {
      student_id: 'S002',
      full_name: 'Jane Smith',
      class: '10B',
      grade_level: 10
    },
    {
      student_id: 'S003',
      full_name: 'Bob Johnson',
      class: '11A',
      grade_level: 11
    }
  ]
};

describe('bulkCreateStudents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create multiple students successfully', async () => {
    const result = await bulkCreateStudents(testInput);

    expect(result.successful).toHaveLength(3);
    expect(result.failed).toHaveLength(0);

    // Verify students are in database
    const students = await db.select().from(studentsTable).execute();
    expect(students).toHaveLength(3);

    // Check first student
    expect(result.successful[0].student_id).toEqual('S001');
    expect(result.successful[0].full_name).toEqual('John Doe');
    expect(result.successful[0].class).toEqual('10A');
    expect(result.successful[0].grade_level).toEqual(10);
    expect(result.successful[0].id).toBeDefined();
    expect(result.successful[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle duplicate student_id', async () => {
    // Create a student first
    await db.insert(studentsTable)
      .values({
        student_id: 'S001',
        full_name: 'Existing Student',
        class: '9A',
        grade_level: 9
      })
      .execute();

    const result = await bulkCreateStudents(testInput);

    expect(result.successful).toHaveLength(2);
    expect(result.failed).toHaveLength(1);

    // Check the failed entry
    expect(result.failed[0].student_data.student_id).toEqual('S001');
    expect(result.failed[0].error).toContain('already exists');

    // Verify successful students are still created
    expect(result.successful[0].student_id).toEqual('S002');
    expect(result.successful[1].student_id).toEqual('S003');
  });

  it('should save all successful students to database', async () => {
    const result = await bulkCreateStudents(testInput);

    // Query database to verify all students were saved
    for (const student of result.successful) {
      const dbStudent = await db.select()
        .from(studentsTable)
        .where(eq(studentsTable.id, student.id))
        .execute();

      expect(dbStudent).toHaveLength(1);
      expect(dbStudent[0].student_id).toEqual(student.student_id);
      expect(dbStudent[0].full_name).toEqual(student.full_name);
      expect(dbStudent[0].class).toEqual(student.class);
      expect(dbStudent[0].grade_level).toEqual(student.grade_level);
      expect(dbStudent[0].total_violation_points).toEqual(0);
      expect(dbStudent[0].is_active).toEqual(true);
      expect(dbStudent[0].created_at).toBeInstanceOf(Date);
    }
  });

  it('should handle empty input array', async () => {
    const emptyInput: BulkCreateStudentsInput = {
      students: []
    };

    const result = await bulkCreateStudents(emptyInput);

    expect(result.successful).toHaveLength(0);
    expect(result.failed).toHaveLength(0);

    // Verify no students were created
    const students = await db.select().from(studentsTable).execute();
    expect(students).toHaveLength(0);
  });

  it('should handle mixed success and failure scenarios', async () => {
    // Create one existing student
    await db.insert(studentsTable)
      .values({
        student_id: 'S002',
        full_name: 'Existing Student',
        class: '9A',
        grade_level: 9
      })
      .execute();

    const result = await bulkCreateStudents(testInput);

    expect(result.successful).toHaveLength(2);
    expect(result.failed).toHaveLength(1);

    // Check that S001 and S003 were created successfully
    const successfulIds = result.successful.map(s => s.student_id);
    expect(successfulIds).toContain('S001');
    expect(successfulIds).toContain('S003');

    // Check that S002 failed
    expect(result.failed[0].student_data.student_id).toEqual('S002');
  });
});