
import { db } from '../db';
import { counselingSessionsTable } from '../db/schema';
import { type CounselingSession, type CounselingStatus } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateCounselingSessionStatus(
  id: number, 
  status: CounselingStatus
): Promise<CounselingSession> {
  try {
    // Update the counseling session status
    const result = await db.update(counselingSessionsTable)
      .set({ 
        status: status,
        updated_at: new Date()
      })
      .where(eq(counselingSessionsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Counseling session with id ${id} not found`);
    }

    const session = result[0];
    return {
      ...session,
      date: session.date,
      created_at: session.created_at,
      updated_at: session.updated_at
    };
  } catch (error) {
    console.error('Counseling session status update failed:', error);
    throw error;
  }
}
