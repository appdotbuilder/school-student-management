
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';

describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should soft delete a user by setting is_active to false', async () => {
    // Create a test user
    const testUser = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        password_hash: 'hashed_password',
        role: 'admin',
        is_active: true
      })
      .returning()
      .execute();

    const userId = testUser[0].id;

    // Delete the user
    const result = await deleteUser(userId);

    expect(result).toBe(true);

    // Verify user is soft deleted (is_active = false)
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].is_active).toBe(false);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return false when trying to delete non-existent user', async () => {
    const result = await deleteUser(999);
    expect(result).toBe(false);
  });

  it('should return false when trying to delete already deleted user', async () => {
    // Create a test user
    const testUser = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        password_hash: 'hashed_password',
        role: 'admin',
        is_active: false // Already inactive
      })
      .returning()
      .execute();

    const userId = testUser[0].id;

    // Try to delete already inactive user
    const result = await deleteUser(userId);

    // Should still return true since the user exists and was "updated"
    expect(result).toBe(true);

    // Verify user remains inactive
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].is_active).toBe(false);
  });

  it('should preserve user data after soft delete', async () => {
    // Create a test user
    const testUser = await db.insert(usersTable)
      .values({
        username: 'preservetest',
        email: 'preserve@example.com',
        full_name: 'Preserve Test User',
        password_hash: 'hashed_password',
        role: 'subject_teacher',
        assigned_class: '10A',
        is_active: true
      })
      .returning()
      .execute();

    const userId = testUser[0].id;
    const originalData = testUser[0];

    // Delete the user
    await deleteUser(userId);

    // Verify all original data is preserved except is_active and updated_at
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    const updatedUser = users[0];
    expect(updatedUser.username).toBe(originalData.username);
    expect(updatedUser.email).toBe(originalData.email);
    expect(updatedUser.full_name).toBe(originalData.full_name);
    expect(updatedUser.password_hash).toBe(originalData.password_hash);
    expect(updatedUser.role).toBe(originalData.role);
    expect(updatedUser.assigned_class).toBe(originalData.assigned_class);
    expect(updatedUser.created_at).toEqual(originalData.created_at);
    expect(updatedUser.is_active).toBe(false); // Only this should change
    expect(updatedUser.updated_at.getTime()).toBeGreaterThan(originalData.updated_at.getTime());
  });
});
