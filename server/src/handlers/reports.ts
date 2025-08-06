
import { db } from '../db';
import { achievementsTable, violationsTable, counselingSessionsTable, studentsTable, usersTable } from '../db/schema';
import { type ReportInput, type Student, type Achievement, type Violation, type CounselingSession } from '../schema';
import { eq, and, gte, lte, SQL } from 'drizzle-orm';

export async function generateReport(input: ReportInput): Promise<{ url: string; filename: string }> {
  try {
    // Generate timestamp for unique filename
    const timestamp = new Date().getTime();
    
    if (input.type === 'student') {
      if (!input.student_id) {
        throw new Error('Student ID is required for student reports');
      }
      
      const filename = `student_${input.student_id}_${timestamp}.${input.format}`;
      const url = `/reports/${filename}`;
      
      return { url, filename };
    } else if (input.type === 'class') {
      if (!input.class) {
        throw new Error('Class is required for class reports');
      }
      
      const filename = `class_${input.class}_${timestamp}.${input.format}`;
      const url = `/reports/${filename}`;
      
      return { url, filename };
    }
    
    throw new Error('Invalid report type');
  } catch (error) {
    console.error('Report generation failed:', error);
    throw error;
  }
}

export async function generateClassReport(className: string, dateFrom: Date, dateTo: Date, format: 'pdf' | 'excel'): Promise<{ url: string; filename: string }> {
  try {
    // Validate that the class exists by checking if there are any students
    const studentsInClass = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.class, className))
      .limit(1)
      .execute();
      
    if (studentsInClass.length === 0) {
      throw new Error('No students found in the specified class');
    }
    
    const timestamp = new Date().getTime();
    const filename = `${className}_report_${timestamp}.${format}`;
    const url = `/reports/${filename}`;
    
    return { url, filename };
  } catch (error) {
    console.error('Class report generation failed:', error);
    throw error;
  }
}

export async function generateStudentSummary(studentId: number): Promise<{
  student: Student | null;
  achievements: number;
  violations: number;
  counselingSessions: number;
  totalViolationPoints: number;
}> {
  try {
    // Get student information
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .execute();
      
    if (students.length === 0) {
      return {
        student: null,
        achievements: 0,
        violations: 0,
        counselingSessions: 0,
        totalViolationPoints: 0
      };
    }
    
    const student = students[0];
    
    // Count achievements
    const achievements = await db.select()
      .from(achievementsTable)
      .where(eq(achievementsTable.student_id, studentId))
      .execute();
      
    // Count violations
    const violations = await db.select()
      .from(violationsTable)
      .where(eq(violationsTable.student_id, studentId))
      .execute();
      
    // Count counseling sessions
    const counselingSessions = await db.select()
      .from(counselingSessionsTable)
      .where(eq(counselingSessionsTable.student_id, studentId))
      .execute();
    
    return {
      student: {
        ...student,
        created_at: new Date(student.created_at),
        updated_at: new Date(student.updated_at)
      },
      achievements: achievements.length,
      violations: violations.length,
      counselingSessions: counselingSessions.length,
      totalViolationPoints: student.total_violation_points
    };
  } catch (error) {
    console.error('Student summary generation failed:', error);
    throw error;
  }
}
