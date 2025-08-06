
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable, usersTable, violationsTable } from '../db/schema';
import { type CreateViolationInput } from '../schema';
import { createViolation } from '../handlers/create_violation';
import { eq } from 'drizzle-orm';

describe('createViolation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let studentId: number;
  let userId: number;

  const testInput: CreateViolationInput = {
    date: new Date('2024-01-15'),
    student_id: 0, // Will be set in beforeEach
    type: 'discipline',
    description: 'Disruptive behavior during class',
    severity: 'medium',
    points: 5,
    handling_method: 'warning'
  };

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teacher1',
        email: 'teacher1@school.com',
        full_name: 'Test Teacher',
        password_hash: 'hashed_password',
        role: 'subject_teacher'
      })
      .returning()
      .execute();

    userId = userResult[0].id;

    // Create test student
    const studentResult = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        class: '10A',
        grade_level: 10,
        total_violation_points: 3 // Initial points
      })
      .returning()
      .execute();

    studentId = studentResult[0].id;
    testInput.student_id = studentId;
  });

  it('should create a violation record', async () => {
    const result = await createViolation(testInput, userId);

    // Verify violation fields
    expect(result.id).toBeDefined();
    expect(result.date).toEqual(testInput.date);
    expect(result.student_id).toEqual(studentId);
    expect(result.type).toEqual('discipline');
    expect(result.description).toEqual('Disruptive behavior during class');
    expect(result.severity).toEqual('medium');
    expect(result.points).toEqual(5);
    expect(result.handling_method).toEqual('warning');
    expect(result.recorded_by).toEqual(userId);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save violation to database', async () => {
    const result = await createViolation(testInput, userId);

    const violations = await db.select()
      .from(violationsTable)
      .where(eq(violationsTable.id, result.id))
      .execute();

    expect(violations).toHaveLength(1);
    const violation = violations[0];
    expect(violation.student_id).toEqual(studentId);
    expect(violation.type).toEqual('discipline');
    expect(violation.description).toEqual('Disruptive behavior during class');
    expect(violation.points).toEqual(5);
    expect(violation.recorded_by).toEqual(userId);
  });

  it('should update student total violation points', async () => {
    await createViolation(testInput, userId);

    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .execute();

    expect(students).toHaveLength(1);
    expect(students[0].total_violation_points).toEqual(8); // 3 initial + 5 new points
    expect(students[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle multiple violations for same student', async () => {
    // Create first violation
    await createViolation(testInput, userId);

    // Create second violation
    const secondInput: CreateViolationInput = {
      ...testInput,
      description: 'Late to class',
      severity: 'light',
      points: 2,
      handling_method: 'parent_call'
    };

    await createViolation(secondInput, userId);

    // Check student total points
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .execute();

    expect(students[0].total_violation_points).toEqual(10); // 3 + 5 + 2
  });

  it('should handle severe violations correctly', async () => {
    const severeInput: CreateViolationInput = {
      ...testInput,
      description: 'Fighting with another student',
      severity: 'heavy',
      points: 15,
      handling_method: 'suspension'
    };

    const result = await createViolation(severeInput, userId);

    expect(result.severity).toEqual('heavy');
    expect(result.points).toEqual(15);
    expect(result.handling_method).toEqual('suspension');

    // Check student total points updated correctly
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .execute();

    expect(students[0].total_violation_points).toEqual(18); // 3 + 15
  });

  it('should throw error for non-existent student', async () => {
    const invalidInput: CreateViolationInput = {
      ...testInput,
      student_id: 99999 // Non-existent student
    };

    await expect(createViolation(invalidInput, userId))
      .rejects.toThrow(/Student with id 99999 not found/i);
  });
});
