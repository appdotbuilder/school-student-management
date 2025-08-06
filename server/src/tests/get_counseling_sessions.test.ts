
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studentsTable, counselingSessionsTable } from '../db/schema';
import { type CreateUserInput, type CreateStudentInput, type CreateCounselingSessionInput } from '../schema';
import { getCounselingSessions, getCounselingSessionsByStudent, getPendingFollowUps } from '../handlers/get_counseling_sessions';

// Test data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'counseling_teacher',
  password: 'password123'
};

const testStudent: CreateStudentInput = {
  student_id: 'STU001',
  full_name: 'Test Student',
  class: '10A',
  grade_level: 10
};

const testStudent2: CreateStudentInput = {
  student_id: 'STU002',
  full_name: 'Test Student 2',
  class: '11B',
  grade_level: 11
};

// Helper functions to create test data directly
async function createTestUser(input: CreateUserInput) {
  const result = await db.insert(usersTable)
    .values({
      username: input.username,
      email: input.email,
      full_name: input.full_name,
      role: input.role,
      password_hash: 'hashed_password', // Mock hash
      assigned_class: input.assigned_class || null
    })
    .returning()
    .execute();
  return result[0];
}

async function createTestStudent(input: CreateStudentInput) {
  const result = await db.insert(studentsTable)
    .values({
      student_id: input.student_id,
      full_name: input.full_name,
      class: input.class,
      grade_level: input.grade_level
    })
    .returning()
    .execute();
  return result[0];
}

async function createTestCounselingSession(input: CreateCounselingSessionInput, recordedBy: number) {
  const result = await db.insert(counselingSessionsTable)
    .values({
      date: input.date,
      student_id: input.student_id,
      purpose: input.purpose,
      session_summary: input.session_summary,
      follow_up_actions: input.follow_up_actions || null,
      status: input.status,
      recorded_by: recordedBy
    })
    .returning()
    .execute();
  return result[0];
}

describe('getCounselingSessions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all counseling sessions when no filter is provided', async () => {
    // Create prerequisites
    const user = await createTestUser(testUser);
    const student = await createTestStudent(testStudent);

    // Create test sessions
    const sessionInput1: CreateCounselingSessionInput = {
      date: new Date('2024-01-15'),
      student_id: student.id,
      purpose: 'Academic counseling',
      session_summary: 'Discussed study habits and time management',
      status: 'completed'
    };

    const sessionInput2: CreateCounselingSessionInput = {
      date: new Date('2024-01-20'),
      student_id: student.id,
      purpose: 'Behavioral counseling',
      session_summary: 'Addressed attendance issues',
      status: 'needs_follow_up'
    };

    await createTestCounselingSession(sessionInput1, user.id);
    await createTestCounselingSession(sessionInput2, user.id);

    const result = await getCounselingSessions();

    expect(result).toHaveLength(2);
    expect(result[0].purpose).toBe('Academic counseling');
    expect(result[1].purpose).toBe('Behavioral counseling');
  });

  it('should filter sessions by student_id', async () => {
    // Create prerequisites
    const user = await createTestUser(testUser);
    const student1 = await createTestStudent(testStudent);
    const student2 = await createTestStudent(testStudent2);

    // Create sessions for different students
    const sessionInput1: CreateCounselingSessionInput = {
      date: new Date('2024-01-15'),
      student_id: student1.id,
      purpose: 'Academic counseling',
      session_summary: 'Student 1 session',
      status: 'completed'
    };

    const sessionInput2: CreateCounselingSessionInput = {
      date: new Date('2024-01-20'),
      student_id: student2.id,
      purpose: 'Behavioral counseling',
      session_summary: 'Student 2 session',
      status: 'completed'
    };

    await createTestCounselingSession(sessionInput1, user.id);
    await createTestCounselingSession(sessionInput2, user.id);

    const result = await getCounselingSessions({ student_id: student1.id });

    expect(result).toHaveLength(1);
    expect(result[0].student_id).toBe(student1.id);
    expect(result[0].session_summary).toBe('Student 1 session');
  });

  it('should filter sessions by class', async () => {
    // Create prerequisites
    const user = await createTestUser(testUser);
    const student1 = await createTestStudent(testStudent); // class 10A
    const student2 = await createTestStudent(testStudent2); // class 11B

    // Create sessions for students in different classes
    const sessionInput1: CreateCounselingSessionInput = {
      date: new Date('2024-01-15'),
      student_id: student1.id,
      purpose: 'Academic counseling',
      session_summary: 'Class 10A session',
      status: 'completed'
    };

    const sessionInput2: CreateCounselingSessionInput = {
      date: new Date('2024-01-20'),
      student_id: student2.id,
      purpose: 'Behavioral counseling',
      session_summary: 'Class 11B session',
      status: 'completed'
    };

    await createTestCounselingSession(sessionInput1, user.id);
    await createTestCounselingSession(sessionInput2, user.id);

    const result = await getCounselingSessions({ class: '10A' });

    expect(result).toHaveLength(1);
    expect(result[0].session_summary).toBe('Class 10A session');
  });

  it('should filter sessions by date range', async () => {
    // Create prerequisites
    const user = await createTestUser(testUser);
    const student = await createTestStudent(testStudent);

    // Create sessions with different dates
    const sessionInput1: CreateCounselingSessionInput = {
      date: new Date('2024-01-10'),
      student_id: student.id,
      purpose: 'Early session',
      session_summary: 'Session before range',
      status: 'completed'
    };

    const sessionInput2: CreateCounselingSessionInput = {
      date: new Date('2024-01-15'),
      student_id: student.id,
      purpose: 'Middle session',
      session_summary: 'Session in range',
      status: 'completed'
    };

    const sessionInput3: CreateCounselingSessionInput = {
      date: new Date('2024-01-25'),
      student_id: student.id,
      purpose: 'Late session',
      session_summary: 'Session after range',
      status: 'completed'
    };

    await createTestCounselingSession(sessionInput1, user.id);
    await createTestCounselingSession(sessionInput2, user.id);
    await createTestCounselingSession(sessionInput3, user.id);

    const result = await getCounselingSessions({
      date_from: new Date('2024-01-12'),
      date_to: new Date('2024-01-20')
    });

    expect(result).toHaveLength(1);
    expect(result[0].session_summary).toBe('Session in range');
  });

  it('should filter sessions by month and year', async () => {
    // Create prerequisites
    const user = await createTestUser(testUser);
    const student = await createTestStudent(testStudent);

    // Create sessions in different months
    const sessionInput1: CreateCounselingSessionInput = {
      date: new Date('2024-01-15'),
      student_id: student.id,
      purpose: 'January session',
      session_summary: 'Session in January',
      status: 'completed'
    };

    const sessionInput2: CreateCounselingSessionInput = {
      date: new Date('2024-02-15'),
      student_id: student.id,
      purpose: 'February session',
      session_summary: 'Session in February',
      status: 'completed'
    };

    await createTestCounselingSession(sessionInput1, user.id);
    await createTestCounselingSession(sessionInput2, user.id);

    const result = await getCounselingSessions({
      month: 1,
      year: 2024
    });

    expect(result).toHaveLength(1);
    expect(result[0].session_summary).toBe('Session in January');
  });
});

describe('getCounselingSessionsByStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all sessions for a specific student', async () => {
    // Create prerequisites
    const user = await createTestUser(testUser);
    const student1 = await createTestStudent(testStudent);
    const student2 = await createTestStudent(testStudent2);

    // Create sessions for different students
    const sessionInput1: CreateCounselingSessionInput = {
      date: new Date('2024-01-15'),
      student_id: student1.id,
      purpose: 'Student 1 session 1',
      session_summary: 'First session for student 1',
      status: 'completed'
    };

    const sessionInput2: CreateCounselingSessionInput = {
      date: new Date('2024-01-20'),
      student_id: student1.id,
      purpose: 'Student 1 session 2',
      session_summary: 'Second session for student 1',
      status: 'needs_follow_up'
    };

    const sessionInput3: CreateCounselingSessionInput = {
      date: new Date('2024-01-25'),
      student_id: student2.id,
      purpose: 'Student 2 session',
      session_summary: 'Session for student 2',
      status: 'completed'
    };

    await createTestCounselingSession(sessionInput1, user.id);
    await createTestCounselingSession(sessionInput2, user.id);
    await createTestCounselingSession(sessionInput3, user.id);

    const result = await getCounselingSessionsByStudent(student1.id);

    expect(result).toHaveLength(2);
    result.forEach(session => {
      expect(session.student_id).toBe(student1.id);
    });
    expect(result[0].purpose).toBe('Student 1 session 1');
    expect(result[1].purpose).toBe('Student 1 session 2');
  });

  it('should return empty array for student with no sessions', async () => {
    // Create prerequisites
    const user = await createTestUser(testUser);
    const student = await createTestStudent(testStudent);

    const result = await getCounselingSessionsByStudent(student.id);

    expect(result).toHaveLength(0);
  });
});

describe('getPendingFollowUps', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return only sessions with needs_follow_up status', async () => {
    // Create prerequisites
    const user = await createTestUser(testUser);
    const student = await createTestStudent(testStudent);

    // Create sessions with different statuses
    const sessionInput1: CreateCounselingSessionInput = {
      date: new Date('2024-01-15'),
      student_id: student.id,
      purpose: 'Completed session',
      session_summary: 'This session is completed',
      status: 'completed'
    };

    const sessionInput2: CreateCounselingSessionInput = {
      date: new Date('2024-01-20'),
      student_id: student.id,
      purpose: 'Follow-up needed',
      session_summary: 'This session needs follow-up',
      status: 'needs_follow_up'
    };

    const sessionInput3: CreateCounselingSessionInput = {
      date: new Date('2024-01-25'),
      student_id: student.id,
      purpose: 'Rescheduled session',
      session_summary: 'This session was rescheduled',
      status: 'rescheduled'
    };

    await createTestCounselingSession(sessionInput1, user.id);
    await createTestCounselingSession(sessionInput2, user.id);
    await createTestCounselingSession(sessionInput3, user.id);

    const result = await getPendingFollowUps();

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('needs_follow_up');
    expect(result[0].purpose).toBe('Follow-up needed');
  });

  it('should return empty array when no follow-ups are needed', async () => {
    // Create prerequisites
    const user = await createTestUser(testUser);
    const student = await createTestStudent(testStudent);

    // Create only completed sessions
    const sessionInput: CreateCounselingSessionInput = {
      date: new Date('2024-01-15'),
      student_id: student.id,
      purpose: 'Completed session',
      session_summary: 'This session is completed',
      status: 'completed'
    };

    await createTestCounselingSession(sessionInput, user.id);

    const result = await getPendingFollowUps();

    expect(result).toHaveLength(0);
  });
});
