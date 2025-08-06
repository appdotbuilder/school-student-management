
import { db } from '../db';
import { achievementsTable, studentsTable, usersTable } from '../db/schema';
import { type Achievement, type RecordFilter } from '../schema';
import { eq, and, gte, lte, SQL } from 'drizzle-orm';

export async function getAchievements(filter?: RecordFilter): Promise<Achievement[]> {
  try {
    // Build conditions array first
    const conditions: SQL<unknown>[] = [];

    if (filter?.student_id !== undefined) {
      conditions.push(eq(achievementsTable.student_id, filter.student_id));
    }

    if (filter?.class) {
      conditions.push(eq(studentsTable.class, filter.class));
    }

    // Handle date filters
    if (filter?.date_from) {
      conditions.push(gte(achievementsTable.date, filter.date_from));
    }

    if (filter?.date_to) {
      conditions.push(lte(achievementsTable.date, filter.date_to));
    }

    // Handle month/year filters (convert to date range)
    if (filter?.year !== undefined) {
      const startOfYear = new Date(filter.year, 0, 1);
      const endOfYear = new Date(filter.year, 11, 31, 23, 59, 59);
      
      if (filter?.month !== undefined) {
        // Specific month in year
        const startOfMonth = new Date(filter.year, filter.month - 1, 1);
        const endOfMonth = new Date(filter.year, filter.month, 0, 23, 59, 59);
        conditions.push(gte(achievementsTable.date, startOfMonth));
        conditions.push(lte(achievementsTable.date, endOfMonth));
      } else {
        // Entire year
        conditions.push(gte(achievementsTable.date, startOfYear));
        conditions.push(lte(achievementsTable.date, endOfYear));
      }
    } else if (filter?.month !== undefined) {
      // Month filter without year - use current year
      const currentYear = new Date().getFullYear();
      const startOfMonth = new Date(currentYear, filter.month - 1, 1);
      const endOfMonth = new Date(currentYear, filter.month, 0, 23, 59, 59);
      conditions.push(gte(achievementsTable.date, startOfMonth));
      conditions.push(lte(achievementsTable.date, endOfMonth));
    }

    // Build the complete query with joins and conditions in one go
    const results = conditions.length > 0
      ? await db.select()
          .from(achievementsTable)
          .innerJoin(studentsTable, eq(achievementsTable.student_id, studentsTable.id))
          .innerJoin(usersTable, eq(achievementsTable.recorded_by, usersTable.id))
          .where(and(...conditions))
          .execute()
      : await db.select()
          .from(achievementsTable)
          .innerJoin(studentsTable, eq(achievementsTable.student_id, studentsTable.id))
          .innerJoin(usersTable, eq(achievementsTable.recorded_by, usersTable.id))
          .execute();

    // Transform joined results back to Achievement format
    return results.map(result => ({
      id: result.achievements.id,
      date: result.achievements.date,
      student_id: result.achievements.student_id,
      type: result.achievements.type,
      activity_description: result.achievements.activity_description,
      level: result.achievements.level,
      awarded_by: result.achievements.awarded_by,
      notes: result.achievements.notes,
      recorded_by: result.achievements.recorded_by,
      created_at: result.achievements.created_at,
      updated_at: result.achievements.updated_at
    }));
  } catch (error) {
    console.error('Get achievements failed:', error);
    throw error;
  }
}

export async function getAchievementsByStudent(studentId: number): Promise<Achievement[]> {
  try {
    const results = await db.select()
      .from(achievementsTable)
      .where(eq(achievementsTable.student_id, studentId))
      .execute();

    return results;
  } catch (error) {
    console.error('Get achievements by student failed:', error);
    throw error;
  }
}

export async function getAchievementsByClass(className: string, filter?: RecordFilter): Promise<Achievement[]> {
  try {
    // Build conditions array starting with class filter
    const conditions: SQL<unknown>[] = [eq(studentsTable.class, className)];

    // Apply additional filters from RecordFilter
    if (filter?.student_id !== undefined) {
      conditions.push(eq(achievementsTable.student_id, filter.student_id));
    }

    if (filter?.date_from) {
      conditions.push(gte(achievementsTable.date, filter.date_from));
    }

    if (filter?.date_to) {
      conditions.push(lte(achievementsTable.date, filter.date_to));
    }

    // Handle month/year filters
    if (filter?.year !== undefined) {
      const startOfYear = new Date(filter.year, 0, 1);
      const endOfYear = new Date(filter.year, 11, 31, 23, 59, 59);
      
      if (filter?.month !== undefined) {
        const startOfMonth = new Date(filter.year, filter.month - 1, 1);
        const endOfMonth = new Date(filter.year, filter.month, 0, 23, 59, 59);
        conditions.push(gte(achievementsTable.date, startOfMonth));
        conditions.push(lte(achievementsTable.date, endOfMonth));
      } else {
        conditions.push(gte(achievementsTable.date, startOfYear));
        conditions.push(lte(achievementsTable.date, endOfYear));
      }
    } else if (filter?.month !== undefined) {
      const currentYear = new Date().getFullYear();
      const startOfMonth = new Date(currentYear, filter.month - 1, 1);
      const endOfMonth = new Date(currentYear, filter.month, 0, 23, 59, 59);
      conditions.push(gte(achievementsTable.date, startOfMonth));
      conditions.push(lte(achievementsTable.date, endOfMonth));
    }

    // Build the complete query with join and all conditions
    const results = await db.select()
      .from(achievementsTable)
      .innerJoin(studentsTable, eq(achievementsTable.student_id, studentsTable.id))
      .where(and(...conditions))
      .execute();

    // Transform joined results back to Achievement format
    return results.map(result => ({
      id: result.achievements.id,
      date: result.achievements.date,
      student_id: result.achievements.student_id,
      type: result.achievements.type,
      activity_description: result.achievements.activity_description,
      level: result.achievements.level,
      awarded_by: result.achievements.awarded_by,
      notes: result.achievements.notes,
      recorded_by: result.achievements.recorded_by,
      created_at: result.achievements.created_at,
      updated_at: result.achievements.updated_at
    }));
  } catch (error) {
    console.error('Get achievements by class failed:', error);
    throw error;
  }
}
