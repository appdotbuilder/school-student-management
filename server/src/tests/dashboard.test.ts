
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  studentsTable, 
  achievementsTable, 
  violationsTable, 
  counselingSessionsTable 
} from '../db/schema';
import { getDashboardData, getNotifications } from '../handlers/dashboard';

// Test data
const testUsers = [
  {
    username: 'admin1',
    email: 'admin@school.edu',
    full_name: 'Admin User',
    password_hash: 'hashed_password',
    role: 'admin' as const,
    assigned_class: null
  },
  {
    username: 'teacher1',
    email: 'teacher@school.edu',
    full_name: 'Subject Teacher',
    password_hash: 'hashed_password',
    role: 'subject_teacher' as const,
    assigned_class: null
  },
  {
    username: 'counselor1',
    email: 'counselor@school.edu',
    full_name: 'Counseling Teacher',
    password_hash: 'hashed_password',
    role: 'counseling_teacher' as const,
    assigned_class: null
  },
  {
    username: 'homeroom1',
    email: 'homeroom@school.edu',
    full_name: 'Homeroom Teacher',
    password_hash: 'hashed_password',
    role: 'homeroom_teacher' as const,
    assigned_class: '10A'
  }
];

const testStudents = [
  {
    student_id: 'STU001',
    full_name: 'John Doe',
    class: '10A',
    grade_level: 10,
    total_violation_points: 75
  },
  {
    student_id: 'STU002',
    full_name: 'Jane Smith',
    class: '10A',
    grade_level: 10,
    total_violation_points: 25
  },
  {
    student_id: 'STU003',
    full_name: 'Bob Wilson',
    class: '10B',
    grade_level: 10,
    total_violation_points: 120
  }
];

describe('getDashboardData', () => {
  let userIds: number[] = [];
  let studentIds: number[] = [];

  beforeEach(async () => {
    await createDB();

    // Insert test users
    const userResults = await db.insert(usersTable)
      .values(testUsers)
      .returning({ id: usersTable.id })
      .execute();
    userIds = userResults.map(r => r.id);

    // Insert test students
    const studentResults = await db.insert(studentsTable)
      .values(testStudents)
      .returning({ id: studentsTable.id })
      .execute();
    studentIds = studentResults.map(r => r.id);

    // Insert test achievements
    await db.insert(achievementsTable)
      .values([
        {
          date: new Date(),
          student_id: studentIds[0],
          type: 'academic',
          activity_description: 'Math competition winner',
          level: 'school',
          awarded_by: 'Math Teacher',
          notes: null,
          recorded_by: userIds[1]
        }
      ])
      .execute();

    // Insert test violations
    await db.insert(violationsTable)
      .values([
        {
          date: new Date(),
          student_id: studentIds[0],
          type: 'discipline',
          description: 'Late to class',
          severity: 'light',
          points: 5,
          handling_method: 'warning',
          recorded_by: userIds[1]
        },
        {
          date: new Date(),
          student_id: studentIds[2],
          type: 'discipline',
          description: 'Fighting',
          severity: 'heavy',
          points: 50,
          handling_method: 'suspension',
          recorded_by: userIds[1]
        }
      ])
      .execute();

    // Insert test counseling session
    await db.insert(counselingSessionsTable)
      .values([
        {
          date: new Date(),
          student_id: studentIds[0],
          purpose: 'Academic counseling',
          session_summary: 'Discussed study habits',
          follow_up_actions: 'Schedule follow-up',
          status: 'needs_follow_up',
          recorded_by: userIds[2]
        }
      ])
      .execute();
  });

  afterEach(resetDB);

  it('should return admin dashboard data', async () => {
    const result = await getDashboardData(userIds[0], 'admin');

    expect(result.role).toEqual('admin');
    expect(result.stats.totalStudents).toEqual(3);
    expect(result.stats.totalUsers).toEqual(4);
    expect(result.stats.totalAchievements).toEqual(1);
    expect(result.stats.totalViolations).toEqual(2);
    expect(result.stats.totalCounselingSessions).toEqual(1);
    expect(Array.isArray(result.recentActivity)).toBe(true);
    expect(Array.isArray(result.notifications)).toBe(true);
  });

  it('should return subject teacher dashboard data', async () => {
    const result = await getDashboardData(userIds[1], 'subject_teacher');

    expect(result.role).toEqual('subject_teacher');
    expect(result.stats.myRecords).toEqual(3); // 1 achievement + 2 violations
    expect(Array.isArray(result.recentActivity)).toBe(true);
    expect(result.recentActivity).toHaveLength(3);

    // Check that recent activity includes correct types
    const activityTypes = result.recentActivity.map(a => a.type);
    expect(activityTypes).toContain('achievement');
    expect(activityTypes).toContain('violation');
  });

  it('should return counseling teacher dashboard data', async () => {
    const result = await getDashboardData(userIds[2], 'counseling_teacher');

    expect(result.role).toEqual('counseling_teacher');
    expect(result.stats.myRecords).toEqual(1);
    expect(result.stats.pendingFollowUps).toEqual(1);
    expect(Array.isArray(result.recentActivity)).toBe(true);
    expect(result.recentActivity).toHaveLength(1);
    expect(result.recentActivity[0].type).toEqual('counseling');
  });

  it('should return homeroom teacher dashboard data', async () => {
    const result = await getDashboardData(userIds[3], 'homeroom_teacher');

    expect(result.role).toEqual('homeroom_teacher');
    expect(result.stats.classStudents).toEqual(2); // Students in class 10A
    expect(result.stats.classViolations).toEqual(1); // Violations by students in 10A
    expect(result.stats.classAchievements).toEqual(1); // Achievements by students in 10A
    expect(Array.isArray(result.recentActivity)).toBe(true);
  });

  it('should handle empty dashboard data gracefully', async () => {
    // Create a new user with no associated records
    const newUserResult = await db.insert(usersTable)
      .values({
        username: 'newteacher',
        email: 'new@school.edu',
        full_name: 'New Teacher',
        password_hash: 'hashed',
        role: 'subject_teacher',
        assigned_class: null
      })
      .returning({ id: usersTable.id })
      .execute();

    const result = await getDashboardData(newUserResult[0].id, 'subject_teacher');

    expect(result.role).toEqual('subject_teacher');
    expect(result.stats.myRecords).toEqual(0);
    expect(result.recentActivity).toHaveLength(0);
    expect(Array.isArray(result.notifications)).toBe(true);
  });
});

describe('getNotifications', () => {
  let userIds: number[] = [];
  let studentIds: number[] = [];

  beforeEach(async () => {
    await createDB();

    // Insert test users
    const userResults = await db.insert(usersTable)
      .values(testUsers)
      .returning({ id: usersTable.id })
      .execute();
    userIds = userResults.map(r => r.id);

    // Insert test students
    const studentResults = await db.insert(studentsTable)
      .values(testStudents)
      .returning({ id: studentsTable.id })
      .execute();
    studentIds = studentResults.map(r => r.id);

    // Insert counseling session needing follow-up
    await db.insert(counselingSessionsTable)
      .values([
        {
          date: new Date(),
          student_id: studentIds[0],
          purpose: 'Behavioral counseling',
          session_summary: 'Discussed behavior issues',
          follow_up_actions: 'Meet again next week',
          status: 'needs_follow_up',
          recorded_by: userIds[2] // Counseling teacher
        }
      ])
      .execute();

    // Insert severe violation
    await db.insert(violationsTable)
      .values([
        {
          date: new Date(),
          student_id: studentIds[2],
          type: 'discipline',
          description: 'Fighting with classmate',
          severity: 'heavy',
          points: 50,
          handling_method: 'suspension',
          recorded_by: userIds[1]
        }
      ])
      .execute();
  });

  afterEach(resetDB);

  it('should return high violation point notifications for admin', async () => {
    const notifications = await getNotifications(userIds[0], 'admin');

    // Should include students with >= 50 points
    const highViolationNotifs = notifications.filter(n => n.type === 'high_violation_points');
    expect(highViolationNotifs.length).toBeGreaterThan(0);

    const johnNotif = highViolationNotifs.find(n => n.student_name === 'John Doe');
    expect(johnNotif).toBeDefined();
    expect(johnNotif?.priority).toEqual('medium'); // 75 points
    expect(johnNotif?.data?.points).toEqual(75);

    const bobNotif = highViolationNotifs.find(n => n.student_name === 'Bob Wilson');
    expect(bobNotif).toBeDefined();
    expect(bobNotif?.priority).toEqual('high'); // 120 points
  });

  it('should return follow-up notifications for counseling teacher', async () => {
    const notifications = await getNotifications(userIds[2], 'counseling_teacher');

    const followUpNotifs = notifications.filter(n => n.type === 'follow_up_needed');
    expect(followUpNotifs).toHaveLength(1);
    
    const followUpNotif = followUpNotifs[0];
    expect(followUpNotif.student_name).toEqual('John Doe');
    expect(followUpNotif.priority).toEqual('medium');
    expect(followUpNotif.data?.purpose).toEqual('Behavioral counseling');
  });

  it('should return severe violation notifications', async () => {
    const notifications = await getNotifications(userIds[0], 'admin');

    const severeNotifs = notifications.filter(n => n.type === 'severe_violation');
    expect(severeNotifs.length).toBeGreaterThan(0);

    const severeNotif = severeNotifs[0];
    expect(severeNotif.student_name).toEqual('Bob Wilson');
    expect(severeNotif.priority).toEqual('high');
    expect(severeNotif.message).toContain('Fighting with classmate');
  });

  it('should filter notifications by homeroom teacher assigned class', async () => {
    const notifications = await getNotifications(userIds[3], 'homeroom_teacher');

    // Should only show notifications for students in class 10A
    const studentNames = notifications.map(n => n.student_name);
    expect(studentNames).toContain('John Doe'); // In class 10A
    expect(studentNames).not.toContain('Bob Wilson'); // In class 10B
  });

  it('should sort notifications by priority', async () => {
    const notifications = await getNotifications(userIds[0], 'admin');

    // High priority should come first
    const priorities = notifications.map(n => n.priority);
    let highIndex = priorities.indexOf('high');
    let mediumIndex = priorities.indexOf('medium');

    if (highIndex !== -1 && mediumIndex !== -1) {
      expect(highIndex).toBeLessThan(mediumIndex);
    }
  });

  it('should return empty notifications for new user', async () => {
    // Create user with no associated records
    const newUserResult = await db.insert(usersTable)
      .values({
        username: 'newuser',
        email: 'newuser@school.edu',
        full_name: 'New User',
        password_hash: 'hashed',
        role: 'subject_teacher',
        assigned_class: null
      })
      .returning({ id: usersTable.id })
      .execute();

    const notifications = await getNotifications(newUserResult[0].id, 'subject_teacher');

    // Subject teachers don't get violation or follow-up notifications
    expect(notifications).toHaveLength(0);
  });
});
