
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test inputs for different user roles
const adminInput: CreateUserInput = {
  username: 'admin_user',
  email: 'admin@school.edu',
  full_name: 'Admin User',
  role: 'admin',
  password: 'securepassword123'
};

const homeroomTeacherInput: CreateUserInput = {
  username: 'homeroom_teacher',
  email: 'homeroom@school.edu',
  full_name: 'Jane Homeroom',
  role: 'homeroom_teacher',
  assigned_class: '10A',
  password: 'teacher123'
};

const subjectTeacherInput: CreateUserInput = {
  username: 'subject_teacher',
  email: 'subject@school.edu',
  full_name: 'John Subject',
  role: 'subject_teacher',
  password: 'teacher456'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an admin user', async () => {
    const result = await createUser(adminInput);

    // Basic field validation
    expect(result.username).toEqual('admin_user');
    expect(result.email).toEqual('admin@school.edu');
    expect(result.full_name).toEqual('Admin User');
    expect(result.role).toEqual('admin');
    expect(result.assigned_class).toBeNull();
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a homeroom teacher with assigned class', async () => {
    const result = await createUser(homeroomTeacherInput);

    expect(result.username).toEqual('homeroom_teacher');
    expect(result.email).toEqual('homeroom@school.edu');
    expect(result.role).toEqual('homeroom_teacher');
    expect(result.assigned_class).toEqual('10A');
    expect(result.is_active).toBe(true);
  });

  it('should create a subject teacher without assigned class', async () => {
    const result = await createUser(subjectTeacherInput);

    expect(result.username).toEqual('subject_teacher');
    expect(result.role).toEqual('subject_teacher');
    expect(result.assigned_class).toBeNull();
    expect(result.is_active).toBe(true);
  });

  it('should save user to database with hashed password', async () => {
    const result = await createUser(adminInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    const savedUser = users[0];
    
    expect(savedUser.username).toEqual('admin_user');
    expect(savedUser.email).toEqual('admin@school.edu');
    expect(savedUser.full_name).toEqual('Admin User');
    expect(savedUser.role).toEqual('admin');
    expect(savedUser.is_active).toBe(true);
    expect(savedUser.password_hash).toBeDefined();
    expect(savedUser.password_hash).not.toEqual('securepassword123'); // Should be hashed
    expect(savedUser.created_at).toBeInstanceOf(Date);
  });

  it('should verify password hash is created correctly', async () => {
    const result = await createUser(adminInput);

    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    const savedUser = users[0];
    
    // Verify password can be verified against hash
    const isPasswordValid = await Bun.password.verify('securepassword123', savedUser.password_hash);
    expect(isPasswordValid).toBe(true);
    
    // Verify wrong password fails
    const isWrongPasswordValid = await Bun.password.verify('wrongpassword', savedUser.password_hash);
    expect(isWrongPasswordValid).toBe(false);
  });

  it('should handle unique constraint violations', async () => {
    // Create first user
    await createUser(adminInput);

    // Try to create another user with same username
    const duplicateInput: CreateUserInput = {
      ...adminInput,
      email: 'different@school.edu' // Different email, same username
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/duplicate/i);
  });

  it('should handle email uniqueness', async () => {
    // Create first user
    await createUser(adminInput);

    // Try to create another user with same email
    const duplicateEmailInput: CreateUserInput = {
      ...adminInput,
      username: 'different_user' // Different username, same email
    };

    await expect(createUser(duplicateEmailInput)).rejects.toThrow(/duplicate/i);
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createUser(adminInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});
