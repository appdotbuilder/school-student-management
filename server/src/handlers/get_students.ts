
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type Student, type StudentFilter } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export async function getStudents(filter?: StudentFilter): Promise<Student[]> {
  try {
    const conditions: SQL<unknown>[] = [];

    if (filter?.class) {
      conditions.push(eq(studentsTable.class, filter.class));
    }

    if (filter?.grade_level !== undefined) {
      conditions.push(eq(studentsTable.grade_level, filter.grade_level));
    }

    if (filter?.is_active !== undefined) {
      conditions.push(eq(studentsTable.is_active, filter.is_active));
    }

    const results = conditions.length > 0
      ? await db.select()
          .from(studentsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(studentsTable)
          .execute();

    return results;
  } catch (error) {
    console.error('Get students failed:', error);
    throw error;
  }
}

export async function getStudentById(id: number): Promise<Student | null> {
  try {
    const results = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, id))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Get student by ID failed:', error);
    throw error;
  }
}

export async function getStudentsByClass(className: string): Promise<Student[]> {
  try {
    const results = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.class, className))
      .execute();

    return results;
  } catch (error) {
    console.error('Get students by class failed:', error);
    throw error;
  }
}
