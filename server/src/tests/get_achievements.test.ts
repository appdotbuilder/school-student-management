
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studentsTable, achievementsTable } from '../db/schema';
import { type CreateUserInput, type CreateStudentInput, type CreateAchievementInput, type RecordFilter } from '../schema';
import { getAchievements, getAchievementsByStudent, getAchievementsByClass } from '../handlers/get_achievements';

// Test data
const testUser: CreateUserInput = {
  username: 'teacher1',
  email: 'teacher@school.com',
  full_name: 'Test Teacher',
  role: 'subject_teacher',
  password: 'password123'
};

const testStudent1: CreateStudentInput = {
  student_id: 'STU001',
  full_name: 'John Doe',
  class: '10A',
  grade_level: 10
};

const testStudent2: CreateStudentInput = {
  student_id: 'STU002',
  full_name: 'Jane Smith',
  class: '10B',
  grade_level: 10
};

const testAchievement1: CreateAchievementInput = {
  date: new Date('2024-01-15'),
  student_id: 1, // Will be set after student creation
  type: 'academic',
  activity_description: 'First place in Math Competition',
  level: 'school',
  awarded_by: 'Math Department',
  notes: 'Excellent performance'
};

const testAchievement2: CreateAchievementInput = {
  date: new Date('2024-02-20'),
  student_id: 2, // Will be set after student creation
  type: 'non_academic',
  activity_description: 'Outstanding community service',
  level: 'district',
  awarded_by: 'Principal',
  notes: null
};

const testAchievement3: CreateAchievementInput = {
  date: new Date('2024-01-25'),
  student_id: 1, // Same student as achievement1
  type: 'academic',
  activity_description: 'Science Fair Winner',
  level: 'city',
  awarded_by: 'Science Department'
};

describe('getAchievements', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  async function setupTestData() {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        full_name: testUser.full_name,
        password_hash: 'hashed_password',
        role: testUser.role
      })
      .returning()
      .execute();

    // Create students
    const student1Result = await db.insert(studentsTable)
      .values({
        student_id: testStudent1.student_id,
        full_name: testStudent1.full_name,
        class: testStudent1.class,
        grade_level: testStudent1.grade_level
      })
      .returning()
      .execute();

    const student2Result = await db.insert(studentsTable)
      .values({
        student_id: testStudent2.student_id,
        full_name: testStudent2.full_name,
        class: testStudent2.class,
        grade_level: testStudent2.grade_level
      })
      .returning()
      .execute();

    // Create achievements
    await db.insert(achievementsTable)
      .values({
        date: testAchievement1.date,
        student_id: student1Result[0].id,
        type: testAchievement1.type,
        activity_description: testAchievement1.activity_description,
        level: testAchievement1.level,
        awarded_by: testAchievement1.awarded_by,
        notes: testAchievement1.notes,
        recorded_by: userResult[0].id
      })
      .execute();

    await db.insert(achievementsTable)
      .values({
        date: testAchievement2.date,
        student_id: student2Result[0].id,
        type: testAchievement2.type,
        activity_description: testAchievement2.activity_description,
        level: testAchievement2.level,
        awarded_by: testAchievement2.awarded_by,
        notes: testAchievement2.notes,
        recorded_by: userResult[0].id
      })
      .execute();

    await db.insert(achievementsTable)
      .values({
        date: testAchievement3.date,
        student_id: student1Result[0].id,
        type: testAchievement3.type,
        activity_description: testAchievement3.activity_description,
        level: testAchievement3.level,
        awarded_by: testAchievement3.awarded_by,
        notes: testAchievement3.notes,
        recorded_by: userResult[0].id
      })
      .execute();

    return {
      userId: userResult[0].id,
      student1Id: student1Result[0].id,
      student2Id: student2Result[0].id
    };
  }

  it('should fetch all achievements without filters', async () => {
    await setupTestData();

    const results = await getAchievements();

    expect(results).toHaveLength(3);
    expect(results[0].activity_description).toEqual('First place in Math Competition');
    expect(results[1].activity_description).toEqual('Outstanding community service');
    expect(results[2].activity_description).toEqual('Science Fair Winner');
    
    // Verify all required fields are present
    results.forEach(achievement => {
      expect(achievement.id).toBeDefined();
      expect(achievement.date).toBeInstanceOf(Date);
      expect(achievement.student_id).toBeDefined();
      expect(achievement.type).toBeDefined();
      expect(achievement.activity_description).toBeDefined();
      expect(achievement.level).toBeDefined();
      expect(achievement.awarded_by).toBeDefined();
      expect(achievement.recorded_by).toBeDefined();
      expect(achievement.created_at).toBeInstanceOf(Date);
      expect(achievement.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should filter achievements by student_id', async () => {
    const { student1Id } = await setupTestData();

    const filter: RecordFilter = { student_id: student1Id };
    const results = await getAchievements(filter);

    expect(results).toHaveLength(2);
    results.forEach(achievement => {
      expect(achievement.student_id).toEqual(student1Id);
    });
    
    const descriptions = results.map(a => a.activity_description);
    expect(descriptions).toContain('First place in Math Competition');
    expect(descriptions).toContain('Science Fair Winner');
  });

  it('should filter achievements by class', async () => {
    await setupTestData();

    const filter: RecordFilter = { class: '10A' };
    const results = await getAchievements(filter);

    expect(results).toHaveLength(2);
    results.forEach(achievement => {
      expect(['First place in Math Competition', 'Science Fair Winner'])
        .toContain(achievement.activity_description);
    });
  });

  it('should filter achievements by date range', async () => {
    await setupTestData();

    const filter: RecordFilter = {
      date_from: new Date('2024-01-01'),
      date_to: new Date('2024-01-31')
    };
    const results = await getAchievements(filter);

    expect(results).toHaveLength(2);
    results.forEach(achievement => {
      expect(achievement.date >= new Date('2024-01-01')).toBe(true);
      expect(achievement.date <= new Date('2024-01-31')).toBe(true);
    });
    
    const descriptions = results.map(a => a.activity_description);
    expect(descriptions).toContain('First place in Math Competition');
    expect(descriptions).toContain('Science Fair Winner');
  });

  it('should filter achievements by month and year', async () => {
    await setupTestData();

    const filter: RecordFilter = {
      month: 1, // January
      year: 2024
    };
    const results = await getAchievements(filter);

    expect(results).toHaveLength(2);
    results.forEach(achievement => {
      const achievementMonth = achievement.date.getMonth() + 1; // getMonth is 0-indexed
      const achievementYear = achievement.date.getFullYear();
      expect(achievementMonth).toEqual(1);
      expect(achievementYear).toEqual(2024);
    });
  });

  it('should filter achievements by year only', async () => {
    await setupTestData();

    const filter: RecordFilter = { year: 2024 };
    const results = await getAchievements(filter);

    expect(results).toHaveLength(3);
    results.forEach(achievement => {
      expect(achievement.date.getFullYear()).toEqual(2024);
    });
  });

  it('should combine multiple filters', async () => {
    const { student1Id } = await setupTestData();

    const filter: RecordFilter = {
      student_id: student1Id,
      month: 1,
      year: 2024
    };
    const results = await getAchievements(filter);

    expect(results).toHaveLength(2);
    results.forEach(achievement => {
      expect(achievement.student_id).toEqual(student1Id);
      expect(achievement.date.getMonth() + 1).toEqual(1);
      expect(achievement.date.getFullYear()).toEqual(2024);
    });
  });

  it('should return empty array when no achievements match filter', async () => {
    await setupTestData();

    const filter: RecordFilter = { class: 'NonExistentClass' };
    const results = await getAchievements(filter);

    expect(results).toHaveLength(0);
  });
});

describe('getAchievementsByStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch achievements for specific student', async () => {
    const { student1Id } = await setupTestData();

    const results = await getAchievementsByStudent(student1Id);

    expect(results).toHaveLength(2);
    results.forEach(achievement => {
      expect(achievement.student_id).toEqual(student1Id);
    });
    
    const descriptions = results.map(a => a.activity_description);
    expect(descriptions).toContain('First place in Math Competition');
    expect(descriptions).toContain('Science Fair Winner');
  });

  it('should return empty array for student with no achievements', async () => {
    const { student2Id } = await setupTestData();
    
    // Remove the achievement for student2
    await db.delete(achievementsTable).execute();
    
    const results = await getAchievementsByStudent(student2Id);

    expect(results).toHaveLength(0);
  });

  async function setupTestData() {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        full_name: testUser.full_name,
        password_hash: 'hashed_password',
        role: testUser.role
      })
      .returning()
      .execute();

    // Create students
    const student1Result = await db.insert(studentsTable)
      .values({
        student_id: testStudent1.student_id,
        full_name: testStudent1.full_name,
        class: testStudent1.class,
        grade_level: testStudent1.grade_level
      })
      .returning()
      .execute();

    const student2Result = await db.insert(studentsTable)
      .values({
        student_id: testStudent2.student_id,
        full_name: testStudent2.full_name,
        class: testStudent2.class,
        grade_level: testStudent2.grade_level
      })
      .returning()
      .execute();

    // Create achievements for student1 only
    await db.insert(achievementsTable)
      .values({
        date: testAchievement1.date,
        student_id: student1Result[0].id,
        type: testAchievement1.type,
        activity_description: testAchievement1.activity_description,
        level: testAchievement1.level,
        awarded_by: testAchievement1.awarded_by,
        notes: testAchievement1.notes,
        recorded_by: userResult[0].id
      })
      .execute();

    await db.insert(achievementsTable)
      .values({
        date: testAchievement2.date,
        student_id: student2Result[0].id,
        type: testAchievement2.type,
        activity_description: testAchievement2.activity_description,
        level: testAchievement2.level,
        awarded_by: testAchievement2.awarded_by,
        notes: testAchievement2.notes,
        recorded_by: userResult[0].id
      })
      .execute();

    await db.insert(achievementsTable)
      .values({
        date: testAchievement3.date,
        student_id: student1Result[0].id,
        type: testAchievement3.type,
        activity_description: testAchievement3.activity_description,
        level: testAchievement3.level,
        awarded_by: testAchievement3.awarded_by,
        notes: testAchievement3.notes,
        recorded_by: userResult[0].id
      })
      .execute();

    return {
      userId: userResult[0].id,
      student1Id: student1Result[0].id,
      student2Id: student2Result[0].id
    };
  }
});

describe('getAchievementsByClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch achievements for specific class', async () => {
    await setupTestData();

    const results = await getAchievementsByClass('10A');

    expect(results).toHaveLength(2);
    results.forEach(achievement => {
      expect(['First place in Math Competition', 'Science Fair Winner'])
        .toContain(achievement.activity_description);
    });
  });

  it('should filter achievements by class and additional filters', async () => {
    await setupTestData();

    const filter: RecordFilter = {
      month: 1,
      year: 2024
    };
    const results = await getAchievementsByClass('10A', filter);

    expect(results).toHaveLength(2);
    results.forEach(achievement => {
      expect(achievement.date.getMonth() + 1).toEqual(1);
      expect(achievement.date.getFullYear()).toEqual(2024);
    });
  });

  it('should return empty array for class with no achievements', async () => {
    await setupTestData();

    const results = await getAchievementsByClass('NonExistentClass');

    expect(results).toHaveLength(0);
  });

  it('should filter by class and date range', async () => {
    await setupTestData();

    const filter: RecordFilter = {
      date_from: new Date('2024-02-01'),
      date_to: new Date('2024-02-28')
    };
    const results = await getAchievementsByClass('10B', filter);

    expect(results).toHaveLength(1);
    expect(results[0].activity_description).toEqual('Outstanding community service');
  });

  async function setupTestData() {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        full_name: testUser.full_name,
        password_hash: 'hashed_password',
        role: testUser.role
      })
      .returning()
      .execute();

    // Create students
    const student1Result = await db.insert(studentsTable)
      .values({
        student_id: testStudent1.student_id,
        full_name: testStudent1.full_name,
        class: testStudent1.class,
        grade_level: testStudent1.grade_level
      })
      .returning()
      .execute();

    const student2Result = await db.insert(studentsTable)
      .values({
        student_id: testStudent2.student_id,
        full_name: testStudent2.full_name,
        class: testStudent2.class,
        grade_level: testStudent2.grade_level
      })
      .returning()
      .execute();

    // Create achievements
    await db.insert(achievementsTable)
      .values({
        date: testAchievement1.date,
        student_id: student1Result[0].id,
        type: testAchievement1.type,
        activity_description: testAchievement1.activity_description,
        level: testAchievement1.level,
        awarded_by: testAchievement1.awarded_by,
        notes: testAchievement1.notes,
        recorded_by: userResult[0].id
      })
      .execute();

    await db.insert(achievementsTable)
      .values({
        date: testAchievement2.date,
        student_id: student2Result[0].id,
        type: testAchievement2.type,
        activity_description: testAchievement2.activity_description,
        level: testAchievement2.level,
        awarded_by: testAchievement2.awarded_by,
        notes: testAchievement2.notes,
        recorded_by: userResult[0].id
      })
      .execute();

    await db.insert(achievementsTable)
      .values({
        date: testAchievement3.date,
        student_id: student1Result[0].id,
        type: testAchievement3.type,
        activity_description: testAchievement3.activity_description,
        level: testAchievement3.level,
        awarded_by: testAchievement3.awarded_by,
        notes: testAchievement3.notes,
        recorded_by: userResult[0].id
      })
      .execute();

    return {
      userId: userResult[0].id,
      student1Id: student1Result[0].id,
      student2Id: student2Result[0].id
    };
  }
});
