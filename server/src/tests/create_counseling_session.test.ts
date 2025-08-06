
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { counselingSessionsTable, studentsTable, usersTable } from '../db/schema';
import { type CreateCounselingSessionInput } from '../schema';
import { createCounselingSession } from '../handlers/create_counseling_session';
import { eq } from 'drizzle-orm';

describe('createCounselingSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testStudentId: number;
  let testUserId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'test_counselor',
        email: 'counselor@test.com',
        full_name: 'Test Counselor',
        password_hash: 'hashed_password',
        role: 'counseling_teacher'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test student
    const studentResult = await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Test Student',
        class: '10A',
        grade_level: 10
      })
      .returning()
      .execute();
    testStudentId = studentResult[0].id;
  });

  const testInput: CreateCounselingSessionInput = {
    date: new Date('2024-01-15'),
    student_id: 0, // Will be set in test
    purpose: 'Academic performance discussion',
    session_summary: 'Student struggling with math concepts. Discussed study strategies and time management techniques.',
    follow_up_actions: 'Schedule weekly check-ins for next month',
    status: 'needs_follow_up'
  };

  it('should create a counseling session', async () => {
    const input = { ...testInput, student_id: testStudentId };
    const result = await createCounselingSession(input, testUserId);

    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.student_id).toEqual(testStudentId);
    expect(result.purpose).toEqual('Academic performance discussion');
    expect(result.session_summary).toEqual(testInput.session_summary);
    expect(result.follow_up_actions).toEqual('Schedule weekly check-ins for next month');
    expect(result.status).toEqual('needs_follow_up');
    expect(result.recorded_by).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save counseling session to database', async () => {
    const input = { ...testInput, student_id: testStudentId };
    const result = await createCounselingSession(input, testUserId);

    const sessions = await db.select()
      .from(counselingSessionsTable)
      .where(eq(counselingSessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].student_id).toEqual(testStudentId);
    expect(sessions[0].purpose).toEqual('Academic performance discussion');
    expect(sessions[0].session_summary).toEqual(testInput.session_summary);
    expect(sessions[0].follow_up_actions).toEqual('Schedule weekly check-ins for next month');
    expect(sessions[0].status).toEqual('needs_follow_up');
    expect(sessions[0].recorded_by).toEqual(testUserId);
    expect(sessions[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null follow_up_actions', async () => {
    const inputWithoutFollowUp = { 
      ...testInput, 
      student_id: testStudentId,
      follow_up_actions: undefined 
    };
    const result = await createCounselingSession(inputWithoutFollowUp, testUserId);

    expect(result.follow_up_actions).toBeNull();

    const sessions = await db.select()
      .from(counselingSessionsTable)
      .where(eq(counselingSessionsTable.id, result.id))
      .execute();

    expect(sessions[0].follow_up_actions).toBeNull();
  });

  it('should create session with completed status', async () => {
    const completedInput = { 
      ...testInput, 
      student_id: testStudentId,
      status: 'completed' as const
    };
    const result = await createCounselingSession(completedInput, testUserId);

    expect(result.status).toEqual('completed');
  });

  it('should throw error when student does not exist', async () => {
    const inputWithInvalidStudent = { ...testInput, student_id: 99999 };

    await expect(createCounselingSession(inputWithInvalidStudent, testUserId))
      .rejects.toThrow(/Student with id 99999 not found/);
  });
});
