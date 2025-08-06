
import { db } from '../db';
import { counselingSessionsTable, studentsTable } from '../db/schema';
import { type CreateCounselingSessionInput, type CounselingSession } from '../schema';
import { eq } from 'drizzle-orm';

export async function createCounselingSession(input: CreateCounselingSessionInput, recordedBy: number): Promise<CounselingSession> {
  try {
    // Verify student exists
    const student = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.student_id))
      .execute();

    if (student.length === 0) {
      throw new Error(`Student with id ${input.student_id} not found`);
    }

    // Insert counseling session record
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
  } catch (error) {
    console.error('Counseling session creation failed:', error);
    throw error;
  }
}
