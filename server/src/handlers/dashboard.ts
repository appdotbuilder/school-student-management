
import { db } from '../db';
import { 
  usersTable, 
  studentsTable, 
  achievementsTable, 
  violationsTable, 
  counselingSessionsTable 
} from '../db/schema';
import { type UserRole } from '../schema';
import { eq, desc, gte, sql, count, sum, and } from 'drizzle-orm';

interface DashboardStats {
  totalStudents?: number;
  totalUsers?: number;
  totalAchievements?: number;
  totalViolations?: number;
  totalCounselingSessions?: number;
  classStudents?: number;
  classViolations?: number;
  classAchievements?: number;
  pendingFollowUps?: number;
  myRecords?: number;
}

interface RecentActivity {
  id: number;
  type: 'achievement' | 'violation' | 'counseling';
  student_name: string;
  description: string;
  date: Date;
}

interface Notification {
  id: number;
  type: 'high_violation_points' | 'follow_up_needed' | 'severe_violation';
  message: string;
  student_id: number;
  student_name: string;
  priority: 'high' | 'medium' | 'low';
  data?: any;
}

interface DashboardData {
  role: UserRole;
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  notifications: Notification[];
}

export async function getDashboardData(userId: number, userRole: UserRole): Promise<DashboardData> {
  try {
    let stats: DashboardStats = {};
    let recentActivity: RecentActivity[] = [];

    // Get user info for homeroom teachers
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    const currentUser = user[0];

    switch (userRole) {
      case 'admin':
        stats = await getAdminStats();
        recentActivity = await getRecentActivityForAdmin();
        break;

      case 'subject_teacher':
        stats = await getTeacherStats(userId);
        recentActivity = await getRecentActivityForTeacher(userId);
        break;

      case 'counseling_teacher':
        stats = await getCounselingTeacherStats(userId);
        recentActivity = await getRecentActivityForCounselor(userId);
        break;

      case 'homeroom_teacher':
        if (currentUser?.assigned_class) {
          stats = await getHomeroomTeacherStats(currentUser.assigned_class);
          recentActivity = await getRecentActivityForClass(currentUser.assigned_class);
        }
        break;
    }

    const notifications = await getNotifications(userId, userRole);

    return {
      role: userRole,
      stats,
      recentActivity,
      notifications
    };
  } catch (error) {
    console.error('Dashboard data fetch failed:', error);
    throw error;
  }
}

async function getAdminStats(): Promise<DashboardStats> {
  // Get total counts for admin dashboard
  const [studentCount, userCount, achievementCount, violationCount, counselingCount] = await Promise.all([
    db.select({ count: count() }).from(studentsTable).where(eq(studentsTable.is_active, true)).execute(),
    db.select({ count: count() }).from(usersTable).where(eq(usersTable.is_active, true)).execute(),
    db.select({ count: count() }).from(achievementsTable).execute(),
    db.select({ count: count() }).from(violationsTable).execute(),
    db.select({ count: count() }).from(counselingSessionsTable).execute()
  ]);

  return {
    totalStudents: studentCount[0].count,
    totalUsers: userCount[0].count,
    totalAchievements: achievementCount[0].count,
    totalViolations: violationCount[0].count,
    totalCounselingSessions: counselingCount[0].count
  };
}

async function getTeacherStats(userId: number): Promise<DashboardStats> {
  // Get records created by this teacher
  const [achievementCount, violationCount] = await Promise.all([
    db.select({ count: count() })
      .from(achievementsTable)
      .where(eq(achievementsTable.recorded_by, userId))
      .execute(),
    db.select({ count: count() })
      .from(violationsTable)
      .where(eq(violationsTable.recorded_by, userId))
      .execute()
  ]);

  return {
    myRecords: achievementCount[0].count + violationCount[0].count
  };
}

async function getCounselingTeacherStats(userId: number): Promise<DashboardStats> {
  // Get counseling sessions and pending follow-ups
  const [sessionCount, pendingCount] = await Promise.all([
    db.select({ count: count() })
      .from(counselingSessionsTable)
      .where(eq(counselingSessionsTable.recorded_by, userId))
      .execute(),
    db.select({ count: count() })
      .from(counselingSessionsTable)
      .where(and(
        eq(counselingSessionsTable.recorded_by, userId),
        eq(counselingSessionsTable.status, 'needs_follow_up')
      ))
      .execute()
  ]);

  return {
    myRecords: sessionCount[0].count,
    pendingFollowUps: pendingCount[0].count
  };
}

async function getHomeroomTeacherStats(assignedClass: string): Promise<DashboardStats> {
  // Get stats for assigned class
  const [studentCount, violationCount, achievementCount] = await Promise.all([
    db.select({ count: count() })
      .from(studentsTable)
      .where(and(
        eq(studentsTable.class, assignedClass),
        eq(studentsTable.is_active, true)
      ))
      .execute(),
    db.select({ count: count() })
      .from(violationsTable)
      .innerJoin(studentsTable, eq(violationsTable.student_id, studentsTable.id))
      .where(eq(studentsTable.class, assignedClass))
      .execute(),
    db.select({ count: count() })
      .from(achievementsTable)
      .innerJoin(studentsTable, eq(achievementsTable.student_id, studentsTable.id))
      .where(eq(studentsTable.class, assignedClass))
      .execute()
  ]);

  return {
    classStudents: studentCount[0].count,
    classViolations: violationCount[0].count,
    classAchievements: achievementCount[0].count
  };
}

async function getRecentActivityForAdmin(): Promise<RecentActivity[]> {
  // Get recent achievements, violations, and counseling sessions
  const [recentAchievements, recentViolations, recentCounseling] = await Promise.all([
    db.select({
      id: achievementsTable.id,
      student_name: studentsTable.full_name,
      description: achievementsTable.activity_description,
      date: achievementsTable.date
    })
    .from(achievementsTable)
    .innerJoin(studentsTable, eq(achievementsTable.student_id, studentsTable.id))
    .orderBy(desc(achievementsTable.created_at))
    .limit(5)
    .execute(),

    db.select({
      id: violationsTable.id,
      student_name: studentsTable.full_name,
      description: violationsTable.description,
      date: violationsTable.date
    })
    .from(violationsTable)
    .innerJoin(studentsTable, eq(violationsTable.student_id, studentsTable.id))
    .orderBy(desc(violationsTable.created_at))
    .limit(5)
    .execute(),

    db.select({
      id: counselingSessionsTable.id,
      student_name: studentsTable.full_name,
      description: counselingSessionsTable.purpose,
      date: counselingSessionsTable.date
    })
    .from(counselingSessionsTable)
    .innerJoin(studentsTable, eq(counselingSessionsTable.student_id, studentsTable.id))
    .orderBy(desc(counselingSessionsTable.created_at))
    .limit(5)
    .execute()
  ]);

  const activities: RecentActivity[] = [
    ...recentAchievements.map(a => ({ ...a, type: 'achievement' as const })),
    ...recentViolations.map(v => ({ ...v, type: 'violation' as const })),
    ...recentCounseling.map(c => ({ ...c, type: 'counseling' as const }))
  ];

  return activities
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);
}

async function getRecentActivityForTeacher(userId: number): Promise<RecentActivity[]> {
  // Get recent records created by this teacher
  const [recentAchievements, recentViolations] = await Promise.all([
    db.select({
      id: achievementsTable.id,
      student_name: studentsTable.full_name,
      description: achievementsTable.activity_description,
      date: achievementsTable.date
    })
    .from(achievementsTable)
    .innerJoin(studentsTable, eq(achievementsTable.student_id, studentsTable.id))
    .where(eq(achievementsTable.recorded_by, userId))
    .orderBy(desc(achievementsTable.created_at))
    .limit(10)
    .execute(),

    db.select({
      id: violationsTable.id,
      student_name: studentsTable.full_name,
      description: violationsTable.description,
      date: violationsTable.date
    })
    .from(violationsTable)
    .innerJoin(studentsTable, eq(violationsTable.student_id, studentsTable.id))
    .where(eq(violationsTable.recorded_by, userId))
    .orderBy(desc(violationsTable.created_at))
    .limit(10)
    .execute()
  ]);

  const activities: RecentActivity[] = [
    ...recentAchievements.map(a => ({ ...a, type: 'achievement' as const })),
    ...recentViolations.map(v => ({ ...v, type: 'violation' as const }))
  ];

  return activities
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);
}

async function getRecentActivityForCounselor(userId: number): Promise<RecentActivity[]> {
  // Get recent counseling sessions by this counselor
  const recentSessions = await db.select({
    id: counselingSessionsTable.id,
    student_name: studentsTable.full_name,
    description: counselingSessionsTable.purpose,
    date: counselingSessionsTable.date
  })
  .from(counselingSessionsTable)
  .innerJoin(studentsTable, eq(counselingSessionsTable.student_id, studentsTable.id))
  .where(eq(counselingSessionsTable.recorded_by, userId))
  .orderBy(desc(counselingSessionsTable.created_at))
  .limit(10)
  .execute();

  return recentSessions.map(s => ({ ...s, type: 'counseling' as const }));
}

async function getRecentActivityForClass(assignedClass: string): Promise<RecentActivity[]> {
  // Get recent activities for students in assigned class
  const [recentAchievements, recentViolations, recentCounseling] = await Promise.all([
    db.select({
      id: achievementsTable.id,
      student_name: studentsTable.full_name,
      description: achievementsTable.activity_description,
      date: achievementsTable.date
    })
    .from(achievementsTable)
    .innerJoin(studentsTable, eq(achievementsTable.student_id, studentsTable.id))
    .where(eq(studentsTable.class, assignedClass))
    .orderBy(desc(achievementsTable.created_at))
    .limit(5)
    .execute(),

    db.select({
      id: violationsTable.id,
      student_name: studentsTable.full_name,
      description: violationsTable.description,
      date: violationsTable.date
    })
    .from(violationsTable)
    .innerJoin(studentsTable, eq(violationsTable.student_id, studentsTable.id))
    .where(eq(studentsTable.class, assignedClass))
    .orderBy(desc(violationsTable.created_at))
    .limit(5)
    .execute(),

    db.select({
      id: counselingSessionsTable.id,
      student_name: studentsTable.full_name,
      description: counselingSessionsTable.purpose,
      date: counselingSessionsTable.date
    })
    .from(counselingSessionsTable)
    .innerJoin(studentsTable, eq(counselingSessionsTable.student_id, studentsTable.id))
    .where(eq(studentsTable.class, assignedClass))
    .orderBy(desc(counselingSessionsTable.created_at))
    .limit(5)
    .execute()
  ]);

  const activities: RecentActivity[] = [
    ...recentAchievements.map(a => ({ ...a, type: 'achievement' as const })),
    ...recentViolations.map(v => ({ ...v, type: 'violation' as const })),
    ...recentCounseling.map(c => ({ ...c, type: 'counseling' as const }))
  ];

  return activities
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);
}

export async function getNotifications(userId: number, userRole: UserRole): Promise<Notification[]> {
  try {
    const notifications: Notification[] = [];

    // Get students with high violation points (>= 50 points)
    const highViolationStudents = await db.select({
      id: studentsTable.id,
      full_name: studentsTable.full_name,
      total_violation_points: studentsTable.total_violation_points,
      class: studentsTable.class
    })
    .from(studentsTable)
    .where(and(
      gte(studentsTable.total_violation_points, 50),
      eq(studentsTable.is_active, true)
    ))
    .execute();

    // Filter by role-specific access
    for (const student of highViolationStudents) {
      if (userRole === 'admin' || 
          (userRole === 'homeroom_teacher' && await isUserAssignedToClass(userId, student.class))) {
        notifications.push({
          id: student.id,
          type: 'high_violation_points',
          message: `${student.full_name} has ${student.total_violation_points} violation points`,
          student_id: student.id,
          student_name: student.full_name,
          priority: student.total_violation_points >= 100 ? 'high' : 'medium',
          data: { points: student.total_violation_points }
        });
      }
    }

    // Get counseling sessions needing follow-up
    if (userRole === 'counseling_teacher' || userRole === 'admin') {
      const followUpSessions = await db.select({
        id: counselingSessionsTable.id,
        student_id: counselingSessionsTable.student_id,
        student_name: studentsTable.full_name,
        purpose: counselingSessionsTable.purpose,
        date: counselingSessionsTable.date
      })
      .from(counselingSessionsTable)
      .innerJoin(studentsTable, eq(counselingSessionsTable.student_id, studentsTable.id))
      .where(
        userRole === 'counseling_teacher' 
          ? and(
              eq(counselingSessionsTable.status, 'needs_follow_up'),
              eq(counselingSessionsTable.recorded_by, userId)
            )
          : eq(counselingSessionsTable.status, 'needs_follow_up')
      )
      .execute();

      for (const session of followUpSessions) {
        notifications.push({
          id: session.id,
          type: 'follow_up_needed',
          message: `Follow-up needed for ${session.student_name}`,
          student_id: session.student_id,
          student_name: session.student_name,
          priority: 'medium',
          data: { purpose: session.purpose, date: session.date }
        });
      }
    }

    // Get recent severe violations
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const severeViolations = await db.select({
      id: violationsTable.id,
      student_id: violationsTable.student_id,
      student_name: studentsTable.full_name,
      description: violationsTable.description,
      class: studentsTable.class
    })
    .from(violationsTable)
    .innerJoin(studentsTable, eq(violationsTable.student_id, studentsTable.id))
    .where(and(
      eq(violationsTable.severity, 'heavy'),
      gte(violationsTable.created_at, oneWeekAgo)
    ))
    .execute();

    for (const violation of severeViolations) {
      if (userRole === 'admin' || 
          (userRole === 'homeroom_teacher' && await isUserAssignedToClass(userId, violation.class))) {
        notifications.push({
          id: violation.id,
          type: 'severe_violation',
          message: `Severe violation: ${violation.description}`,
          student_id: violation.student_id,
          student_name: violation.student_name,
          priority: 'high',
          data: { description: violation.description }
        });
      }
    }

    // Sort by priority and limit to 20 notifications
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return notifications
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, 20);

  } catch (error) {
    console.error('Notifications fetch failed:', error);
    throw error;
  }
}

async function isUserAssignedToClass(userId: number, studentClass: string): Promise<boolean> {
  const user = await db.select({ assigned_class: usersTable.assigned_class })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .execute();

  return user[0]?.assigned_class === studentClass;
}
