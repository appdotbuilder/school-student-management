
import { db } from '../db';
import { violationsTable, studentsTable } from '../db/schema';
import { type CreateViolationInput, type Violation } from '../schema';
import { eq } from 'drizzle-orm';

export async function createViolation(input: CreateViolationInput, recordedBy: number): Promise<Violation> {
  try {
    // Verify that the student exists
    const student = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.student_id))
      .execute();

    if (student.length === 0) {
      throw new Error(`Student with id ${input.student_id} not found`);
    }

    // Insert the violation record
    const result = await db.insert(violationsTable)
      .values({
        date: input.date,
        student_id: input.student_id,
        type: input.type,
        description: input.description,
        severity: input.severity,
        points: input.points,
        handling_method: input.handling_method,
        recorded_by: recordedBy
      })
      .returning()
      .execute();

    const violation = result[0];

    // Update the student's total violation points
    const currentTotalPoints = student[0].total_violation_points;
    const newTotalPoints = currentTotalPoints + input.points;

    await db.update(studentsTable)
      .set({ 
        total_violation_points: newTotalPoints,
        updated_at: new Date()
      })
      .where(eq(studentsTable.id, input.student_id))
      .execute();

    return violation;
  } catch (error) {
    console.error('Violation creation failed:', error);
    throw error;
  }
}
