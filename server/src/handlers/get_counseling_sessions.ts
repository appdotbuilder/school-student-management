
import { db } from '../db';
import { counselingSessionsTable, studentsTable } from '../db/schema';
import { type CounselingSession, type RecordFilter } from '../schema';
import { eq, and, gte, lte, SQL } from 'drizzle-orm';

export async function getCounselingSessions(filter?: RecordFilter): Promise<CounselingSession[]> {
  try {
    // Handle class filter with join separately
    if (filter?.class) {
      const results = await db.select()
        .from(counselingSessionsTable)
        .innerJoin(studentsTable, eq(counselingSessionsTable.student_id, studentsTable.id))
        .where(eq(studentsTable.class, filter.class))
        .execute();

      return results.map(result => result.counseling_sessions as CounselingSession);
    }

    // Handle other filters without join
    const conditions: SQL<unknown>[] = [];

    if (filter?.student_id) {
      conditions.push(eq(counselingSessionsTable.student_id, filter.student_id));
    }

    if (filter?.date_from) {
      conditions.push(gte(counselingSessionsTable.date, filter.date_from));
    }

    if (filter?.date_to) {
      conditions.push(lte(counselingSessionsTable.date, filter.date_to));
    }

    // Handle month/year filtering
    if (filter?.month && filter?.year) {
      const startDate = new Date(filter.year, filter.month - 1, 1);
      const endDate = new Date(filter.year, filter.month, 0, 23, 59, 59);
      conditions.push(gte(counselingSessionsTable.date, startDate));
      conditions.push(lte(counselingSessionsTable.date, endDate));
    }

    // Build and execute query
    if (conditions.length > 0) {
      const results = await db.select()
        .from(counselingSessionsTable)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .execute();
      return results as CounselingSession[];
    } else {
      const results = await db.select()
        .from(counselingSessionsTable)
        .execute();
      return results as CounselingSession[];
    }
  } catch (error) {
    console.error('Failed to fetch counseling sessions:', error);
    throw error;
  }
}

export async function getCounselingSessionsByStudent(studentId: number): Promise<CounselingSession[]> {
  try {
    const results = await db.select()
      .from(counselingSessionsTable)
      .where(eq(counselingSessionsTable.student_id, studentId))
      .execute();

    return results as CounselingSession[];
  } catch (error) {
    console.error('Failed to fetch counseling sessions by student:', error);
    throw error;
  }
}

export async function getPendingFollowUps(): Promise<CounselingSession[]> {
  try {
    const results = await db.select()
      .from(counselingSessionsTable)
      .where(eq(counselingSessionsTable.status, 'needs_follow_up'))
      .execute();

    return results as CounselingSession[];
  } catch (error) {
    console.error('Failed to fetch pending follow-ups:', error);
    throw error;
  }
}
