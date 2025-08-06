
import { db } from '../db';
import { achievementsTable, studentsTable } from '../db/schema';
import { type CreateAchievementInput, type Achievement } from '../schema';
import { eq } from 'drizzle-orm';

export async function createAchievement(input: CreateAchievementInput, recordedBy: number): Promise<Achievement> {
  try {
    // Verify student exists
    const student = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.student_id))
      .execute();

    if (student.length === 0) {
      throw new Error(`Student with ID ${input.student_id} not found`);
    }

    // Insert achievement record
    const result = await db.insert(achievementsTable)
      .values({
        date: input.date,
        student_id: input.student_id,
        type: input.type,
        activity_description: input.activity_description,
        level: input.level,
        awarded_by: input.awarded_by,
        notes: input.notes || null,
        recorded_by: recordedBy
      })
      .returning()
      .execute();

    const achievement = result[0];
    return achievement;
  } catch (error) {
    console.error('Achievement creation failed:', error);
    throw error;
  }
}
