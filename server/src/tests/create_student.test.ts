
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type CreateStudentInput } from '../schema';
import { createStudent } from '../handlers/create_student';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateStudentInput = {
  student_id: 'STU001',
  full_name: 'John Doe',
  class: '10A',
  grade_level: 10
};

describe('createStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a student', async () => {
    const result = await createStudent(testInput);

    // Basic field validation
    expect(result.student_id).toEqual('STU001');
    expect(result.full_name).toEqual('John Doe');
    expect(result.class).toEqual('10A');
    expect(result.grade_level).toEqual(10);
    expect(result.total_violation_points).toEqual(0);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save student to database', async () => {
    const result = await createStudent(testInput);

    // Query using proper drizzle syntax
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, result.id))
      .execute();

    expect(students).toHaveLength(1);
    expect(students[0].student_id).toEqual('STU001');
    expect(students[0].full_name).toEqual('John Doe');
    expect(students[0].class).toEqual('10A');
    expect(students[0].grade_level).toEqual(10);
    expect(students[0].total_violation_points).toEqual(0);
    expect(students[0].is_active).toEqual(true);
    expect(students[0].created_at).toBeInstanceOf(Date);
  });

  it('should reject duplicate student_id', async () => {
    // Create first student
    await createStudent(testInput);

    // Try to create another student with same student_id
    await expect(createStudent(testInput)).rejects.toThrow(/unique/i);
  });

  it('should create students with different student_ids', async () => {
    const student1 = await createStudent(testInput);

    const testInput2: CreateStudentInput = {
      student_id: 'STU002',
      full_name: 'Jane Smith',
      class: '11B',
      grade_level: 11
    };

    const student2 = await createStudent(testInput2);

    expect(student1.id).not.toEqual(student2.id);
    expect(student1.student_id).toEqual('STU001');
    expect(student2.student_id).toEqual('STU002');
  });
});
