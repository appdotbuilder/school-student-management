
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers, getUsersByRole } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create test users
    await db.insert(usersTable).values([
      {
        username: 'admin1',
        email: 'admin@school.com',
        full_name: 'Admin User',
        password_hash: 'hashed_password',
        role: 'admin',
        assigned_class: null
      },
      {
        username: 'teacher1',
        email: 'teacher@school.com',
        full_name: 'Teacher User',
        password_hash: 'hashed_password',
        role: 'subject_teacher',
        assigned_class: '10A'
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    expect(result[0].username).toEqual('admin1');
    expect(result[0].email).toEqual('admin@school.com');
    expect(result[0].full_name).toEqual('Admin User');
    expect(result[0].role).toEqual('admin');
    expect(result[0].assigned_class).toBeNull();
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].username).toEqual('teacher1');
    expect(result[1].role).toEqual('subject_teacher');
    expect(result[1].assigned_class).toEqual('10A');
  });

  it('should include inactive users', async () => {
    await db.insert(usersTable).values({
      username: 'inactive_user',
      email: 'inactive@school.com',
      full_name: 'Inactive User',
      password_hash: 'hashed_password',
      role: 'counseling_teacher',
      assigned_class: null,
      is_active: false
    }).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    expect(result[0].is_active).toBe(false);
    expect(result[0].username).toEqual('inactive_user');
  });
});

describe('getUsersByRole', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users with specified role exist', async () => {
    await db.insert(usersTable).values({
      username: 'admin1',
      email: 'admin@school.com',
      full_name: 'Admin User',
      password_hash: 'hashed_password',
      role: 'admin',
      assigned_class: null
    }).execute();

    const result = await getUsersByRole('subject_teacher');
    expect(result).toEqual([]);
  });

  it('should return users with specified role only', async () => {
    await db.insert(usersTable).values([
      {
        username: 'admin1',
        email: 'admin@school.com',
        full_name: 'Admin User',
        password_hash: 'hashed_password',
        role: 'admin',
        assigned_class: null
      },
      {
        username: 'teacher1',
        email: 'teacher1@school.com',
        full_name: 'Subject Teacher 1',
        password_hash: 'hashed_password',
        role: 'subject_teacher',
        assigned_class: null
      },
      {
        username: 'teacher2',
        email: 'teacher2@school.com',
        full_name: 'Subject Teacher 2',
        password_hash: 'hashed_password',
        role: 'subject_teacher',
        assigned_class: null
      },
      {
        username: 'homeroom1',
        email: 'homeroom@school.com',
        full_name: 'Homeroom Teacher',
        password_hash: 'hashed_password',
        role: 'homeroom_teacher',
        assigned_class: '10A'
      }
    ]).execute();

    const result = await getUsersByRole('subject_teacher');

    expect(result).toHaveLength(2);
    expect(result[0].username).toEqual('teacher1');
    expect(result[0].role).toEqual('subject_teacher');
    expect(result[0].full_name).toEqual('Subject Teacher 1');
    expect(result[1].username).toEqual('teacher2');
    expect(result[1].role).toEqual('subject_teacher');
    expect(result[1].full_name).toEqual('Subject Teacher 2');
  });

  it('should filter homeroom teachers correctly', async () => {
    await db.insert(usersTable).values([
      {
        username: 'homeroom1',
        email: 'homeroom1@school.com',
        full_name: 'Homeroom Teacher 1',
        password_hash: 'hashed_password',
        role: 'homeroom_teacher',
        assigned_class: '10A'
      },
      {
        username: 'counselor1',
        email: 'counselor@school.com',
        full_name: 'Counseling Teacher',
        password_hash: 'hashed_password',
        role: 'counseling_teacher',
        assigned_class: null
      }
    ]).execute();

    const result = await getUsersByRole('homeroom_teacher');

    expect(result).toHaveLength(1);
    expect(result[0].username).toEqual('homeroom1');
    expect(result[0].role).toEqual('homeroom_teacher');
    expect(result[0].assigned_class).toEqual('10A');
  });

  it('should include inactive users with specified role', async () => {
    await db.insert(usersTable).values([
      {
        username: 'active_admin',
        email: 'active@school.com',
        full_name: 'Active Admin',
        password_hash: 'hashed_password',
        role: 'admin',
        assigned_class: null,
        is_active: true
      },
      {
        username: 'inactive_admin',
        email: 'inactive@school.com',
        full_name: 'Inactive Admin',
        password_hash: 'hashed_password',
        role: 'admin',
        assigned_class: null,
        is_active: false
      }
    ]).execute();

    const result = await getUsersByRole('admin');

    expect(result).toHaveLength(2);
    const usernames = result.map(u => u.username);
    expect(usernames).toContain('active_admin');
    expect(usernames).toContain('inactive_admin');
    
    const inactiveUser = result.find(u => u.username === 'inactive_admin');
    expect(inactiveUser?.is_active).toBe(false);
  });
});
