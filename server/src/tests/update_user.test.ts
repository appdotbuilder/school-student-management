
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type UpdateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper function to create a test user
const createTestUser = async (): Promise<number> => {
  const testUserData = {
    username: 'testuser',
    email: 'test@example.com',
    full_name: 'Test User',
    password_hash: 'hashed_password',
    role: 'admin' as const,
    assigned_class: null,
    is_active: true
  };

  const result = await db.insert(usersTable)
    .values(testUserData)
    .returning()
    .execute();

  return result[0].id;
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user with all fields', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'updateduser',
      email: 'updated@example.com',
      full_name: 'Updated User',
      role: 'subject_teacher',
      assigned_class: '10A',
      is_active: false
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('updateduser');
    expect(result.email).toEqual('updated@example.com');
    expect(result.full_name).toEqual('Updated User');
    expect(result.role).toEqual('subject_teacher');
    expect(result.assigned_class).toEqual('10A');
    expect(result.is_active).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update user with partial fields', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'newusername',
      role: 'homeroom_teacher'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('newusername');
    expect(result.role).toEqual('homeroom_teacher');
    // Other fields should remain unchanged
    expect(result.email).toEqual('test@example.com');
    expect(result.full_name).toEqual('Test User');
    expect(result.is_active).toEqual(true);
  });

  it('should persist changes to database', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      email: 'newemail@example.com',
      assigned_class: '11B'
    };

    await updateUser(updateInput);

    // Verify changes are persisted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('newemail@example.com');
    expect(users[0].assigned_class).toEqual('11B');
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle assigned_class set to null', async () => {
    // Create user with assigned class
    const testUserData = {
      username: 'classroomteacher',
      email: 'teacher@example.com',
      full_name: 'Classroom Teacher',
      password_hash: 'hashed_password',
      role: 'homeroom_teacher' as const,
      assigned_class: '10A',
      is_active: true
    };

    const result = await db.insert(usersTable)
      .values(testUserData)
      .returning()
      .execute();

    const userId = result[0].id;

    const updateInput: UpdateUserInput = {
      id: userId,
      assigned_class: null
    };

    const updatedUser = await updateUser(updateInput);

    expect(updatedUser.assigned_class).toBeNull();
  });

  it('should throw error when user not found', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999,
      username: 'nonexistent'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/user not found/i);
  });

  it('should update only updated_at when no fields provided', async () => {
    const userId = await createTestUser();
    
    // Get original user data
    const originalUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    const updateInput: UpdateUserInput = {
      id: userId
    };

    const result = await updateUser(updateInput);

    expect(result.username).toEqual(originalUser[0].username);
    expect(result.email).toEqual(originalUser[0].email);
    expect(result.full_name).toEqual(originalUser[0].full_name);
    expect(result.updated_at > originalUser[0].updated_at).toBe(true);
  });
});
