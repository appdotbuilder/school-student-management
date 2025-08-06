
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable, usersTable, achievementsTable, violationsTable, counselingSessionsTable } from '../db/schema';
import { type ReportInput, type CreateStudentInput, type CreateUserInput } from '../schema';
import { generateReport, generateClassReport, generateStudentSummary } from '../handlers/reports';

// Test data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'admin',
  password: 'password123'
};

const testStudent: CreateStudentInput = {
  student_id: 'ST001',
  full_name: 'Test Student',
  class: '10A',
  grade_level: 10
};

describe('Reports Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('generateReport', () => {
    it('should generate student report URL and filename', async () => {
      // Create prerequisite data
      const userResult = await db.insert(usersTable)
        .values({
          ...testUser,
          password_hash: 'hashed_password'
        })
        .returning()
        .execute();

      const studentResult = await db.insert(studentsTable)
        .values(testStudent)
        .returning()
        .execute();

      const reportInput: ReportInput = {
        type: 'student',
        format: 'pdf',
        student_id: studentResult[0].id,
        date_from: new Date('2024-01-01'),
        date_to: new Date('2024-12-31')
      };

      const result = await generateReport(reportInput);

      expect(result.url).toMatch(/^\/reports\/student_\d+_\d+\.pdf$/);
      expect(result.filename).toMatch(/^student_\d+_\d+\.pdf$/);
      expect(result.filename).toContain(studentResult[0].id.toString());
    });

    it('should generate class report URL and filename', async () => {
      // Create prerequisite data
      await db.insert(studentsTable)
        .values(testStudent)
        .returning()
        .execute();

      const reportInput: ReportInput = {
        type: 'class',
        format: 'excel',
        class: '10A',
        date_from: new Date('2024-01-01'),
        date_to: new Date('2024-12-31')
      };

      const result = await generateReport(reportInput);

      expect(result.url).toMatch(/^\/reports\/class_10A_\d+\.excel$/);
      expect(result.filename).toMatch(/^class_10A_\d+\.excel$/);
    });

    it('should throw error for student report without student_id', async () => {
      const reportInput: ReportInput = {
        type: 'student',
        format: 'pdf',
        date_from: new Date('2024-01-01'),
        date_to: new Date('2024-12-31')
      };

      await expect(generateReport(reportInput)).rejects.toThrow(/student id is required/i);
    });

    it('should throw error for class report without class', async () => {
      const reportInput: ReportInput = {
        type: 'class',
        format: 'pdf',
        date_from: new Date('2024-01-01'),
        date_to: new Date('2024-12-31')
      };

      await expect(generateReport(reportInput)).rejects.toThrow(/class is required/i);
    });
  });

  describe('generateClassReport', () => {
    it('should generate class report with valid class', async () => {
      // Create prerequisite data
      await db.insert(studentsTable)
        .values(testStudent)
        .returning()
        .execute();

      const result = await generateClassReport(
        '10A',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        'pdf'
      );

      expect(result.url).toMatch(/^\/reports\/10A_report_\d+\.pdf$/);
      expect(result.filename).toMatch(/^10A_report_\d+\.pdf$/);
    });

    it('should throw error for non-existent class', async () => {
      await expect(generateClassReport(
        'NON_EXISTENT',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        'pdf'
      )).rejects.toThrow(/no students found/i);
    });

    it('should generate excel format correctly', async () => {
      await db.insert(studentsTable)
        .values(testStudent)
        .returning()
        .execute();

      const result = await generateClassReport(
        '10A',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        'excel'
      );

      expect(result.filename).toMatch(/\.excel$/);
      expect(result.url).toMatch(/\.excel$/);
    });
  });

  describe('generateStudentSummary', () => {
    it('should generate summary for existing student with records', async () => {
      // Create prerequisite data
      const userResult = await db.insert(usersTable)
        .values({
          ...testUser,
          password_hash: 'hashed_password'
        })
        .returning()
        .execute();

      const studentResult = await db.insert(studentsTable)
        .values({
          ...testStudent,
          total_violation_points: 15
        })
        .returning()
        .execute();

      const studentId = studentResult[0].id;
      const userId = userResult[0].id;

      // Create some test records
      await db.insert(achievementsTable)
        .values({
          date: new Date('2024-01-15'),
          student_id: studentId,
          type: 'academic',
          activity_description: 'Math Competition Winner',
          level: 'school',
          awarded_by: 'Math Department',
          recorded_by: userId
        })
        .execute();

      await db.insert(violationsTable)
        .values({
          date: new Date('2024-02-01'),
          student_id: studentId,
          type: 'discipline',
          description: 'Late to class',
          severity: 'light',
          points: 5,
          handling_method: 'warning',
          recorded_by: userId
        })
        .execute();

      await db.insert(counselingSessionsTable)
        .values({
          date: new Date('2024-02-05'),
          student_id: studentId,
          purpose: 'Academic guidance',
          session_summary: 'Discussed study habits',
          status: 'completed',
          recorded_by: userId
        })
        .execute();

      const result = await generateStudentSummary(studentId);

      expect(result.student).not.toBeNull();
      expect(result.student!.id).toBe(studentId);
      expect(result.student!.full_name).toBe('Test Student');
      expect(result.student!.class).toBe('10A');
      expect(result.achievements).toBe(1);
      expect(result.violations).toBe(1);
      expect(result.counselingSessions).toBe(1);
      expect(result.totalViolationPoints).toBe(15);
    });

    it('should return null student for non-existent student ID', async () => {
      const result = await generateStudentSummary(999);

      expect(result.student).toBeNull();
      expect(result.achievements).toBe(0);
      expect(result.violations).toBe(0);
      expect(result.counselingSessions).toBe(0);
      expect(result.totalViolationPoints).toBe(0);
    });

    it('should handle student with no records', async () => {
      const studentResult = await db.insert(studentsTable)
        .values(testStudent)
        .returning()
        .execute();

      const result = await generateStudentSummary(studentResult[0].id);

      expect(result.student).not.toBeNull();
      expect(result.student!.full_name).toBe('Test Student');
      expect(result.achievements).toBe(0);
      expect(result.violations).toBe(0);
      expect(result.counselingSessions).toBe(0);
      expect(result.totalViolationPoints).toBe(0);
    });
  });
});
