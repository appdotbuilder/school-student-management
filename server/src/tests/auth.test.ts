
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type CreateUserInput } from '../schema';
import { loginUser, getCurrentUser, changePassword } from '../handlers/auth';
import { eq } from 'drizzle-orm';

// Test user data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'admin',
  assigned_class: null,
  password: 'password123'
};

const testLoginInput: LoginInput = {
  username: 'testuser',
  password: 'password123'
};

// Helper function to create a test user
async function createTestUser() {
  const passwordHash = Buffer.from('password123' + 'salt').toString('base64');
  
  const result = await db.insert(usersTable)
    .values({
      username: testUser.username,
      email: testUser.email,
      full_name: testUser.full_name,
      password_hash: passwordHash,
      role: testUser.role,
      assigned_class: testUser.assigned_class
    })
    .returning()
    .execute();

  return result[0];
}

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login user with valid credentials', async () => {
    // Create test user first
    await createTestUser();

    const result = await loginUser(testLoginInput);

    expect(result).not.toBeNull();
    expect(result!.user.username).toEqual('testuser');
    expect(result!.user.email).toEqual('test@example.com');
    expect(result!.user.full_name).toEqual('Test User');
    expect(result!.user.role).toEqual('admin');
    expect(result!.token).toBeDefined();
    expect(typeof result!.token).toBe('string');
  });

  it('should return null for invalid username', async () => {
    await createTestUser();

    const invalidLogin: LoginInput = {
      username: 'nonexistent',
      password: 'password123'
    };

    const result = await loginUser(invalidLogin);
    expect(result).toBeNull();
  });

  it('should return null for invalid password', async () => {
    await createTestUser();

    const invalidLogin: LoginInput = {
      username: 'testuser',
      password: 'wrongpassword'
    };

    const result = await loginUser(invalidLogin);
    expect(result).toBeNull();
  });

  it('should return null for inactive user', async () => {
    const createdUser = await createTestUser();
    
    // Deactivate user
    await db.update(usersTable)
      .set({ is_active: false })
      .where(eq(usersTable.id, createdUser.id))
      .execute();

    const result = await loginUser(testLoginInput);
    expect(result).toBeNull();
  });
});

describe('getCurrentUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user for valid token', async () => {
    const createdUser = await createTestUser();
    const loginResult = await loginUser(testLoginInput);

    expect(loginResult).not.toBeNull();
    
    const currentUser = await getCurrentUser(loginResult!.token);

    expect(currentUser).not.toBeNull();
    expect(currentUser!.id).toEqual(createdUser.id);
    expect(currentUser!.username).toEqual('testuser');
    expect(currentUser!.email).toEqual('test@example.com');
    expect(currentUser!.role).toEqual('admin');
  });

  it('should return null for invalid token', async () => {
    await createTestUser();

    const result = await getCurrentUser('invalid-token');
    expect(result).toBeNull();
  });

  it('should return null for inactive user with valid token', async () => {
    const createdUser = await createTestUser();
    const loginResult = await loginUser(testLoginInput);

    expect(loginResult).not.toBeNull();

    // Deactivate user after login
    await db.update(usersTable)
      .set({ is_active: false })
      .where(eq(usersTable.id, createdUser.id))
      .execute();

    const currentUser = await getCurrentUser(loginResult!.token);
    expect(currentUser).toBeNull();
  });
});

describe('changePassword', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should change password successfully', async () => {
    const createdUser = await createTestUser();

    const result = await changePassword(
      createdUser.id,
      'password123',
      'newpassword456'
    );

    expect(result).toBe(true);

    // Verify password was changed by trying to login with new password
    const newLoginInput: LoginInput = {
      username: 'testuser',
      password: 'newpassword456'
    };

    const loginResult = await loginUser(newLoginInput);
    expect(loginResult).not.toBeNull();
    expect(loginResult!.user.username).toEqual('testuser');
  });

  it('should fail with wrong old password', async () => {
    const createdUser = await createTestUser();

    const result = await changePassword(
      createdUser.id,
      'wrongoldpassword',
      'newpassword456'
    );

    expect(result).toBe(false);
  });

  it('should fail for non-existent user', async () => {
    await createTestUser();

    const result = await changePassword(
      99999, // Non-existent user ID
      'password123',
      'newpassword456'
    );

    expect(result).toBe(false);
  });

  it('should update updated_at timestamp', async () => {
    const createdUser = await createTestUser();
    const originalUpdatedAt = createdUser.updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = await changePassword(
      createdUser.id,
      'password123',
      'newpassword456'
    );

    expect(result).toBe(true);

    // Check that updated_at was changed
    const updatedUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, createdUser.id))
      .execute();

    expect(updatedUsers[0].updated_at > originalUpdatedAt).toBe(true);
  });
});
