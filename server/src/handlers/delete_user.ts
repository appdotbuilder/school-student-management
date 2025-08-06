
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteUser(id: number): Promise<boolean> {
  try {
    // Soft delete: set is_active to false instead of hard delete
    // This preserves referential integrity for related records
    const result = await db.update(usersTable)
      .set({ 
        is_active: false,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, id))
      .returning()
      .execute();

    // Return true if a user was found and updated
    return result.length > 0;
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
}
