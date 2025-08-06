
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { achievementsTable, studentsTable, usersTable } from '../db/schema';
import { type CreateAchievementInput } from '../schema';
import { createAchievement } from '../handlers/create_achievement';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  username: 'test_teacher',
  email: 'teacher@test.com',
  full_name: 'Test Teacher',
  password_hash: 'hashed_password',
  role: 'subject_teacher' as const,
  assigned_class: null
};

const testStudent = {
  student_id: 'STD001',
  full_name: 'Test Student',
  class: '10A',
  grade_level: 10,
  total_violation_points: 0
};

const testInput: CreateAchievementInput = {
  date: new Date('2024-01-15'),
  student_id: 0, // Will be set after student creation
  type: 'academic',
  activity_description: 'First place in Math Olympiad',
  level: 'school',
  awarded_by: 'Math Department',
  notes: 'Excellent performance in mathematics'
};

describe('createAchievement', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an achievement', async () => {
    // Create prerequisite records
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const userId = userResult[0].id;

    const studentResult = await db.insert(studentsTable).values(testStudent).returning().execute();
    const studentId = studentResult[0].id;

    // Create achievement
    const input = { ...testInput, student_id: studentId };
    const result = await createAchievement(input, userId);

    // Basic field validation
    expect(result.id).toBeDefined();
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.student_id).toEqual(studentId);
    expect(result.type).toEqual('academic');
    expect(result.activity_description).toEqual('First place in Math Olympiad');
    expect(result.level).toEqual('school');
    expect(result.awarded_by).toEqual('Math Department');
    expect(result.notes).toEqual('Excellent performance in mathematics');
    expect(result.recorded_by).toEqual(userId);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save achievement to database', async () => {
    // Create prerequisite records
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const userId = userResult[0].id;

    const studentResult = await db.insert(studentsTable).values(testStudent).returning().execute();
    const studentId = studentResult[0].id;

    // Create achievement
    const input = { ...testInput, student_id: studentId };
    const result = await createAchievement(input, userId);

    // Verify it was saved to database
    const achievements = await db.select()
      .from(achievementsTable)
      .where(eq(achievementsTable.id, result.id))
      .execute();

    expect(achievements).toHaveLength(1);
    expect(achievements[0].student_id).toEqual(studentId);
    expect(achievements[0].activity_description).toEqual('First place in Math Olympiad');
    expect(achievements[0].recorded_by).toEqual(userId);
    expect(achievements[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle achievement with no notes', async () => {
    // Create prerequisite records
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const userId = userResult[0].id;

    const studentResult = await db.insert(studentsTable).values(testStudent).returning().execute();
    const studentId = studentResult[0].id;

    // Create achievement without notes
    const input = {
      date: new Date('2024-01-15'),
      student_id: studentId,
      type: 'non_academic' as const,
      activity_description: 'Won debate competition',
      level: 'district' as const,
      awarded_by: 'English Department'
    };

    const result = await createAchievement(input, userId);

    expect(result.notes).toBeNull();
    expect(result.type).toEqual('non_academic');
    expect(result.level).toEqual('district');
  });

  it('should throw error for non-existent student', async () => {
    // Create user but no student
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const userId = userResult[0].id;

    const input = { ...testInput, student_id: 999 }; // Non-existent student ID

    await expect(createAchievement(input, userId)).rejects.toThrow(/Student with ID 999 not found/);
  });

  it('should create multiple achievements for same student', async () => {
    // Create prerequisite records
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const userId = userResult[0].id;

    const studentResult = await db.insert(studentsTable).values(testStudent).returning().execute();
    const studentId = studentResult[0].id;

    // Create first achievement
    const input1 = { ...testInput, student_id: studentId };
    const result1 = await createAchievement(input1, userId);

    // Create second achievement
    const input2 = {
      ...testInput,
      student_id: studentId,
      activity_description: 'Second place in Science Fair',
      type: 'academic' as const,
      level: 'city' as const
    };
    const result2 = await createAchievement(input2, userId);

    // Verify both achievements exist
    const achievements = await db.select()
      .from(achievementsTable)
      .where(eq(achievementsTable.student_id, studentId))
      .execute();

    expect(achievements).toHaveLength(2);
    expect(achievements.map(a => a.id)).toContain(result1.id);
    expect(achievements.map(a => a.id)).toContain(result2.id);
  });
});
