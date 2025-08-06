import { db } from '../db';
import { studentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type BulkCreateStudentsInput, type Student } from '../schema';

interface BulkCreateResult {
  successful: Student[];
  failed: Array<{
    student_data: any;
    error: string;
  }>;
}

export const bulkCreateStudents = async (input: BulkCreateStudentsInput): Promise<BulkCreateResult> => {
  try {
    const successful: Student[] = [];
    const failed: Array<{ student_data: any; error: string }> = [];

    // Process each student individually to handle duplicates and errors
    for (const studentData of input.students) {
      try {
        // Check if student_id already exists
        const existingStudent = await db.select()
          .from(studentsTable)
          .where(eq(studentsTable.student_id, studentData.student_id))
          .limit(1)
          .execute();

        if (existingStudent.length > 0) {
          failed.push({
            student_data: studentData,
            error: `Student ID ${studentData.student_id} already exists`
          });
          continue;
        }

        // Create the student
        const result = await db.insert(studentsTable)
          .values({
            student_id: studentData.student_id,
            full_name: studentData.full_name,
            class: studentData.class,
            grade_level: studentData.grade_level
          })
          .returning()
          .execute();

        successful.push(result[0]);
      } catch (error: any) {
        failed.push({
          student_data: studentData,
          error: error.message || 'Failed to create student'
        });
      }
    }

    return {
      successful,
      failed
    };
  } catch (error) {
    console.error('Bulk student creation failed:', error);
    throw error;
  }
};