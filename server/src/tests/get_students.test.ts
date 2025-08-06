
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type CreateStudentInput } from '../schema';
import { getStudents, getStudentById, getStudentsByClass } from '../handlers/get_students';
import { eq } from 'drizzle-orm';

// Test data
const testStudent1: CreateStudentInput = {
  student_id: 'STU001',
  full_name: 'Alice Johnson',
  class: '10A',
  grade_level: 10
};

const testStudent2: CreateStudentInput = {
  student_id: 'STU002',
  full_name: 'Bob Smith',
  class: '10B',
  grade_level: 10
};

const testStudent3: CreateStudentInput = {
  student_id: 'STU003',
  full_name: 'Charlie Brown',
  class: '11A',
  grade_level: 11
};

describe('getStudents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all students when no filter provided', async () => {
    // Insert test students
    await db.insert(studentsTable).values([
      testStudent1,
      testStudent2,
      testStudent3
    ]).execute();

    const result = await getStudents();

    expect(result).toHaveLength(3);
    expect(result.map(s => s.student_id)).toEqual(['STU001', 'STU002', 'STU003']);
  });

  it('should filter students by class', async () => {
    // Insert test students
    await db.insert(studentsTable).values([
      testStudent1,
      testStudent2,
      testStudent3
    ]).execute();

    const result = await getStudents({ class: '10A' });

    expect(result).toHaveLength(1);
    expect(result[0].student_id).toEqual('STU001');
    expect(result[0].class).toEqual('10A');
  });

  it('should filter students by grade level', async () => {
    // Insert test students
    await db.insert(studentsTable).values([
      testStudent1,
      testStudent2,
      testStudent3
    ]).execute();

    const result = await getStudents({ grade_level: 10 });

    expect(result).toHaveLength(2);
    expect(result.map(s => s.student_id).sort()).toEqual(['STU001', 'STU002']);
    result.forEach(student => {
      expect(student.grade_level).toEqual(10);
    });
  });

  it('should filter students by active status', async () => {
    // Insert test students
    const students = await db.insert(studentsTable).values([
      testStudent1,
      testStudent2,
      testStudent3
    ]).returning().execute();

    // Deactivate one student
    await db.update(studentsTable)
      .set({ is_active: false })
      .where(eq(studentsTable.id, students[0].id))
      .execute();

    const result = await getStudents({ is_active: false });

    expect(result).toHaveLength(1);
    expect(result[0].student_id).toEqual('STU001');
    expect(result[0].is_active).toEqual(false);
  });

  it('should apply multiple filters', async () => {
    // Insert test students
    await db.insert(studentsTable).values([
      testStudent1,
      testStudent2,
      testStudent3
    ]).execute();

    const result = await getStudents({ 
      grade_level: 10,
      class: '10B'
    });

    expect(result).toHaveLength(1);
    expect(result[0].student_id).toEqual('STU002');
    expect(result[0].class).toEqual('10B');
    expect(result[0].grade_level).toEqual(10);
  });

  it('should return empty array when no students match filter', async () => {
    // Insert test students
    await db.insert(studentsTable).values([testStudent1]).execute();

    const result = await getStudents({ class: 'NonExistent' });

    expect(result).toHaveLength(0);
  });
});

describe('getStudentById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return student by ID', async () => {
    // Insert test student
    const students = await db.insert(studentsTable)
      .values(testStudent1)
      .returning()
      .execute();

    const result = await getStudentById(students[0].id);

    expect(result).not.toBeNull();
    expect(result?.student_id).toEqual('STU001');
    expect(result?.full_name).toEqual('Alice Johnson');
    expect(result?.class).toEqual('10A');
    expect(result?.grade_level).toEqual(10);
    expect(result?.is_active).toEqual(true);
    expect(result?.total_violation_points).toEqual(0);
    expect(result?.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent ID', async () => {
    const result = await getStudentById(999);

    expect(result).toBeNull();
  });
});

describe('getStudentsByClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all students in a class', async () => {
    // Insert test students
    await db.insert(studentsTable).values([
      testStudent1,
      testStudent2,
      testStudent3
    ]).execute();

    const result = await getStudentsByClass('10A');

    expect(result).toHaveLength(1);
    expect(result[0].student_id).toEqual('STU001');
    expect(result[0].class).toEqual('10A');
  });

  it('should return empty array for class with no students', async () => {
    // Insert test students
    await db.insert(studentsTable).values([testStudent1]).execute();

    const result = await getStudentsByClass('NonExistent');

    expect(result).toHaveLength(0);
  });

  it('should return multiple students from same class', async () => {
    // Create additional student in same class
    const sameClassStudent: CreateStudentInput = {
      student_id: 'STU004',
      full_name: 'David Wilson',
      class: '10A',
      grade_level: 10
    };

    await db.insert(studentsTable).values([
      testStudent1,
      testStudent2,
      sameClassStudent
    ]).execute();

    const result = await getStudentsByClass('10A');

    expect(result).toHaveLength(2);
    expect(result.map(s => s.student_id).sort()).toEqual(['STU001', 'STU004']);
    result.forEach(student => {
      expect(student.class).toEqual('10A');
    });
  });
});
