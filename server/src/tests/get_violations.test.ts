
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studentsTable, violationsTable } from '../db/schema';
import { type CreateUserInput, type CreateStudentInput, type CreateViolationInput } from '../schema';
import { getViolations, getViolationsByStudent, getViolationsByClass } from '../handlers/get_violations';

const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'homeroom_teacher',
  password: 'password123'
};

const testStudent1: CreateStudentInput = {
  student_id: 'S001',
  full_name: 'Student One',
  class: '10A',
  grade_level: 10
};

const testStudent2: CreateStudentInput = {
  student_id: 'S002',
  full_name: 'Student Two',
  class: '10B',
  grade_level: 10
};

describe('getViolations handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  async function createTestData() {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        full_name: testUser.full_name,
        password_hash: 'hashed_password',
        role: testUser.role
      })
      .returning()
      .execute();

    // Create students
    const student1Result = await db.insert(studentsTable)
      .values(testStudent1)
      .returning()
      .execute();

    const student2Result = await db.insert(studentsTable)
      .values(testStudent2)
      .returning()
      .execute();

    const userId = userResult[0].id;
    const student1Id = student1Result[0].id;
    const student2Id = student2Result[0].id;

    // Create test violations
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const violation1: CreateViolationInput = {
      date: now,
      student_id: student1Id,
      type: 'discipline',
      description: 'Late to class',
      severity: 'light',
      points: 5,
      handling_method: 'warning'
    };

    const violation2: CreateViolationInput = {
      date: yesterday,
      student_id: student2Id,
      type: 'uniform',
      description: 'Improper uniform',
      severity: 'medium',
      points: 10,
      handling_method: 'parent_call'
    };

    await db.insert(violationsTable)
      .values([
        {
          ...violation1,
          recorded_by: userId
        },
        {
          ...violation2,
          recorded_by: userId
        }
      ])
      .execute();

    return { userId, student1Id, student2Id, now, yesterday };
  }

  describe('getViolations', () => {
    it('should return all violations without filter', async () => {
      await createTestData();

      const results = await getViolations();

      expect(results).toHaveLength(2);
      expect(results[0].type).toBeDefined();
      expect(results[0].description).toBeDefined();
      expect(results[0].date).toBeInstanceOf(Date);
      expect(results[0].created_at).toBeInstanceOf(Date);
      expect(results[0].updated_at).toBeInstanceOf(Date);
    });

    it('should filter violations by student_id', async () => {
      const { student1Id } = await createTestData();

      const results = await getViolations({ student_id: student1Id });

      expect(results).toHaveLength(1);
      expect(results[0].student_id).toBe(student1Id);
      expect(results[0].description).toBe('Late to class');
    });

    it('should filter violations by date range', async () => {
      const { now } = await createTestData();

      const results = await getViolations({ 
        date_from: now,
        date_to: now
      });

      expect(results).toHaveLength(1);
      expect(results[0].description).toBe('Late to class');
    });

    it('should filter violations by class', async () => {
      await createTestData();

      const results = await getViolations({ class: '10A' });

      expect(results).toHaveLength(1);
      expect(results[0].description).toBe('Late to class');
    });

    it('should return empty array when no violations match filter', async () => {
      await createTestData();

      const results = await getViolations({ class: 'NonExistent' });

      expect(results).toHaveLength(0);
    });
  });

  describe('getViolationsByStudent', () => {
    it('should return violations for specific student', async () => {
      const { student1Id } = await createTestData();

      const results = await getViolationsByStudent(student1Id);

      expect(results).toHaveLength(1);
      expect(results[0].student_id).toBe(student1Id);
      expect(results[0].description).toBe('Late to class');
      expect(results[0].type).toBe('discipline');
      expect(results[0].severity).toBe('light');
      expect(results[0].points).toBe(5);
      expect(results[0].handling_method).toBe('warning');
      expect(results[0].date).toBeInstanceOf(Date);
    });

    it('should return empty array for student with no violations', async () => {
      const { student1Id } = await createTestData();
      
      // Use a different student ID that doesn't have violations
      const results = await getViolationsByStudent(student1Id + 999);

      expect(results).toHaveLength(0);
    });
  });

  describe('getViolationsByClass', () => {
    it('should return violations for specific class', async () => {
      await createTestData();

      const results = await getViolationsByClass('10A');

      expect(results).toHaveLength(1);
      expect(results[0].description).toBe('Late to class');
      expect(results[0].date).toBeInstanceOf(Date);
      expect(results[0].created_at).toBeInstanceOf(Date);
      expect(results[0].updated_at).toBeInstanceOf(Date);
    });

    it('should filter violations by class and date range', async () => {
      const { yesterday } = await createTestData();

      const results = await getViolationsByClass('10B', { 
        date_from: yesterday,
        date_to: yesterday
      });

      expect(results).toHaveLength(1);
      expect(results[0].description).toBe('Improper uniform');
    });

    it('should return empty array for class with no violations', async () => {
      await createTestData();

      const results = await getViolationsByClass('NonExistentClass');

      expect(results).toHaveLength(0);
    });

    it('should filter violations by class and student_id', async () => {
      const { student1Id } = await createTestData();

      const results = await getViolationsByClass('10A', { 
        student_id: student1Id 
      });

      expect(results).toHaveLength(1);
      expect(results[0].student_id).toBe(student1Id);
      expect(results[0].description).toBe('Late to class');
    });
  });
});
