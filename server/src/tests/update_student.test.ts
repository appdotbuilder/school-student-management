
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type CreateStudentInput, type UpdateStudentInput } from '../schema';
import { updateStudent } from '../handlers/update_student';
import { eq } from 'drizzle-orm';

// Create a test student first
const createTestStudent = async (): Promise<number> => {
  const testStudentData = {
    student_id: 'TEST001',
    full_name: 'Test Student',
    class: 'X-1',
    grade_level: 10,
    total_violation_points: 0,
    is_active: true
  };

  const result = await db.insert(studentsTable)
    .values(testStudentData)
    .returning()
    .execute();

  return result[0].id;
};

describe('updateStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update student information', async () => {
    const studentId = await createTestStudent();

    const updateInput: UpdateStudentInput = {
      id: studentId,
      full_name: 'Updated Student Name',
      class: 'XI-2',
      grade_level: 11
    };

    const result = await updateStudent(updateInput);

    expect(result.id).toEqual(studentId);
    expect(result.full_name).toEqual('Updated Student Name');
    expect(result.class).toEqual('XI-2');
    expect(result.grade_level).toEqual(11);
    expect(result.student_id).toEqual('TEST001'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const studentId = await createTestStudent();

    const updateInput: UpdateStudentInput = {
      id: studentId,
      full_name: 'Partially Updated Student'
    };

    const result = await updateStudent(updateInput);

    expect(result.full_name).toEqual('Partially Updated Student');
    expect(result.class).toEqual('X-1'); // Should remain unchanged
    expect(result.grade_level).toEqual(10); // Should remain unchanged
    expect(result.student_id).toEqual('TEST001'); // Should remain unchanged
  });

  it('should persist changes to database', async () => {
    const studentId = await createTestStudent();

    const updateInput: UpdateStudentInput = {
      id: studentId,
      full_name: 'Database Updated Student',
      is_active: false
    };

    await updateStudent(updateInput);

    // Verify changes in database
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .execute();

    expect(students).toHaveLength(1);
    expect(students[0].full_name).toEqual('Database Updated Student');
    expect(students[0].is_active).toEqual(false);
    expect(students[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update student_id field', async () => {
    const studentId = await createTestStudent();

    const updateInput: UpdateStudentInput = {
      id: studentId,
      student_id: 'UPDATED001'
    };

    const result = await updateStudent(updateInput);

    expect(result.student_id).toEqual('UPDATED001');
    expect(result.full_name).toEqual('Test Student'); // Should remain unchanged
  });

  it('should update is_active status', async () => {
    const studentId = await createTestStudent();

    const updateInput: UpdateStudentInput = {
      id: studentId,
      is_active: false
    };

    const result = await updateStudent(updateInput);

    expect(result.is_active).toEqual(false);
    expect(result.full_name).toEqual('Test Student'); // Should remain unchanged
  });

  it('should throw error when student not found', async () => {
    const updateInput: UpdateStudentInput = {
      id: 99999, // Non-existent student
      full_name: 'Non-existent Student'
    };

    await expect(updateStudent(updateInput)).rejects.toThrow(/Student with id 99999 not found/);
  });

  it('should update grade level correctly', async () => {
    const studentId = await createTestStudent();

    const updateInput: UpdateStudentInput = {
      id: studentId,
      grade_level: 12
    };

    const result = await updateStudent(updateInput);

    expect(result.grade_level).toEqual(12);
    expect(typeof result.grade_level).toEqual('number');
  });

  it('should always update updated_at timestamp', async () => {
    const studentId = await createTestStudent();

    // Get original timestamp
    const originalStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .execute();

    const originalUpdatedAt = originalStudent[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateStudentInput = {
      id: studentId,
      full_name: 'Timestamp Test Student'
    };

    const result = await updateStudent(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
