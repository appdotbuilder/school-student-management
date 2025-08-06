
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env['JWT_SECRET'] || 'default-secret-key';

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  return Buffer.from(password + 'salt').toString('base64');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Simple JWT implementation without external dependencies
function createToken(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = Buffer.from(`${encodedHeader}.${encodedPayload}.${JWT_SECRET}`).toString('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = Buffer.from(`${encodedHeader}.${encodedPayload}.${JWT_SECRET}`).toString('base64url');
    
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
    
    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) return null;
    
    return payload;
  } catch {
    return null;
  }
}

export async function loginUser(input: LoginInput): Promise<{ user: User; token: string } | null> {
  try {
    // Find user by username
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    if (users.length === 0) {
      return null;
    }

    const dbUser = users[0];

    // Verify password
    if (!verifyPassword(input.password, dbUser.password_hash)) {
      return null;
    }

    // Check if user is active
    if (!dbUser.is_active) {
      return null;
    }

    // Generate token
    const tokenPayload = {
      userId: dbUser.id,
      username: dbUser.username,
      role: dbUser.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    const token = createToken(tokenPayload);

    // Return user without password hash
    const user: User = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      full_name: dbUser.full_name,
      role: dbUser.role,
      assigned_class: dbUser.assigned_class,
      is_active: dbUser.is_active,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at
    };

    return { user, token };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function getCurrentUser(token: string): Promise<User | null> {
  try {
    // Verify and decode token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return null;
    }

    // Find user by ID from token
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, decoded.userId))
      .execute();

    if (users.length === 0) {
      return null;
    }

    const dbUser = users[0];

    // Check if user is still active
    if (!dbUser.is_active) {
      return null;
    }

    // Return user without password hash
    const user: User = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      full_name: dbUser.full_name,
      role: dbUser.role,
      assigned_class: dbUser.assigned_class,
      is_active: dbUser.is_active,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at
    };

    return user;
  } catch (error) {
    // Token verification failed or user not found
    return null;
  }
}

export async function changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
  try {
    // Find user by ID
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (users.length === 0) {
      return false;
    }

    const dbUser = users[0];

    // Verify old password
    if (!verifyPassword(oldPassword, dbUser.password_hash)) {
      return false;
    }

    // Hash new password
    const newPasswordHash = hashPassword(newPassword);

    // Update password in database
    await db.update(usersTable)
      .set({
        password_hash: newPasswordHash,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, userId))
      .execute();

    return true;
  } catch (error) {
    console.error('Password change failed:', error);
    throw error;
  }
}
