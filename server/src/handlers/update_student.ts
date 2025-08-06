
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type UpdateStudentInput, type Student } from '../schema';
import { eq } from 'drizzle-orm';

export const updateStudent = async (input: UpdateStudentInput): Promise<Student> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof studentsTable.$inferInsert> = {};
    
    if (input.student_id !== undefined) {
      updateData.student_id = input.student_id;
    }
    
    if (input.full_name !== undefined) {
      updateData.full_name = input.full_name;
    }
    
    if (input.class !== undefined) {
      updateData.class = input.class;
    }
    
    if (input.grade_level !== undefined) {
      updateData.grade_level = input.grade_level;
    }
    
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update student record
    const result = await db.update(studentsTable)
      .set(updateData)
      .where(eq(studentsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Student with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Student update failed:', error);
    throw error;
  }
};
