
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studentsTable, counselingSessionsTable } from '../db/schema';
import { type CreateUserInput, type CreateStudentInput } from '../schema';
import { updateCounselingSessionStatus } from '../handlers/update_counseling_session';
import { eq } from 'drizzle-orm';

describe('updateCounselingSessionStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let studentId: number;
  let sessionId: number;

  beforeEach(async () => {
    // Create test user
    const userInput: CreateUserInput = {
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'counseling_teacher',
      password: 'password123'
    };

    const userResult = await db.insert(usersTable)
      .values({
        username: userInput.username,
        email: userInput.email,
        full_name: userInput.full_name,
        role: userInput.role,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    userId = userResult[0].id;

    // Create test student
    const studentInput: CreateStudentInput = {
      student_id: 'STU001',
      full_name: 'Test Student',
      class: '10A',
      grade_level: 10
    };

    const studentResult = await db.insert(studentsTable)
      .values(studentInput)
      .returning()
      .execute();

    studentId = studentResult[0].id;

    // Create test counseling session
    const sessionResult = await db.insert(counselingSessionsTable)
      .values({
        date: new Date('2024-01-15'),
        student_id: studentId,
        purpose: 'Academic counseling',
        session_summary: 'Discussed study habits and time management',
        follow_up_actions: 'Weekly check-ins',
        status: 'needs_follow_up',
        recorded_by: userId
      })
      .returning()
      .execute();

    sessionId = sessionResult[0].id;
  });

  it('should update counseling session status', async () => {
    const result = await updateCounselingSessionStatus(sessionId, 'completed');

    expect(result.id).toEqual(sessionId);
    expect(result.status).toEqual('completed');
    expect(result.student_id).toEqual(studentId);
    expect(result.purpose).toEqual('Academic counseling');
    expect(result.session_summary).toEqual('Discussed study habits and time management');
    expect(result.follow_up_actions).toEqual('Weekly check-ins');
    expect(result.recorded_by).toEqual(userId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save status update to database', async () => {
    await updateCounselingSessionStatus(sessionId, 'rescheduled');

    const sessions = await db.select()
      .from(counselingSessionsTable)
      .where(eq(counselingSessionsTable.id, sessionId))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].status).toEqual('rescheduled');
    expect(sessions[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple status transitions correctly', async () => {
    // Update from needs_follow_up to completed
    const result1 = await updateCounselingSessionStatus(sessionId, 'completed');
    expect(result1.status).toEqual('completed');

    // Update from completed to rescheduled
    const result2 = await updateCounselingSessionStatus(sessionId, 'rescheduled');
    expect(result2.status).toEqual('rescheduled');

    // Verify final state in database
    const sessions = await db.select()
      .from(counselingSessionsTable)
      .where(eq(counselingSessionsTable.id, sessionId))
      .execute();

    expect(sessions[0].status).toEqual('rescheduled');
  });

  it('should throw error for non-existent session', async () => {
    const nonExistentId = 99999;

    expect(
      updateCounselingSessionStatus(nonExistentId, 'completed')
    ).rejects.toThrow(/not found/i);
  });

  it('should handle all valid status values', async () => {
    // Test completed status
    const result1 = await updateCounselingSessionStatus(sessionId, 'completed');
    expect(result1.status).toEqual('completed');

    // Test needs_follow_up status
    const result2 = await updateCounselingSessionStatus(sessionId, 'needs_follow_up');
    expect(result2.status).toEqual('needs_follow_up');

    // Test rescheduled status
    const result3 = await updateCounselingSessionStatus(sessionId, 'rescheduled');
    expect(result3.status).toEqual('rescheduled');
  });
});
