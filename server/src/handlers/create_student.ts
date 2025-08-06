
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type CreateStudentInput, type Student } from '../schema';

export const createStudent = async (input: CreateStudentInput): Promise<Student> => {
  try {
    // Insert student record
    const result = await db.insert(studentsTable)
      .values({
        student_id: input.student_id,
        full_name: input.full_name,
        class: input.class,
        grade_level: input.grade_level
      })
      .returning()
      .execute();

    const student = result[0];
    return student;
  } catch (error) {
    console.error('Student creation failed:', error);
    throw error;
  }
};
