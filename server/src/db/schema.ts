
import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'subject_teacher', 'counseling_teacher', 'homeroom_teacher']);
export const achievementTypeEnum = pgEnum('achievement_type', ['academic', 'non_academic']);
export const achievementLevelEnum = pgEnum('achievement_level', ['school', 'district', 'city', 'province']);
export const violationTypeEnum = pgEnum('violation_type', ['discipline', 'attitude', 'uniform', 'attendance', 'academic', 'other']);
export const violationSeverityEnum = pgEnum('violation_severity', ['light', 'medium', 'heavy']);
export const handlingMethodEnum = pgEnum('handling_method', ['warning', 'parent_call', 'coaching', 'suspension', 'community_service']);
export const counselingStatusEnum = pgEnum('counseling_status', ['completed', 'needs_follow_up', 'rescheduled']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  full_name: text('full_name').notNull(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  assigned_class: text('assigned_class'), // Nullable for non-homeroom teachers
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Students table
export const studentsTable = pgTable('students', {
  id: serial('id').primaryKey(),
  student_id: text('student_id').notNull().unique(),
  full_name: text('full_name').notNull(),
  class: text('class').notNull(),
  grade_level: integer('grade_level').notNull(),
  total_violation_points: integer('total_violation_points').default(0).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Achievements table
export const achievementsTable = pgTable('achievements', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  student_id: integer('student_id').notNull().references(() => studentsTable.id),
  type: achievementTypeEnum('type').notNull(),
  activity_description: text('activity_description').notNull(),
  level: achievementLevelEnum('level').notNull(),
  awarded_by: text('awarded_by').notNull(),
  notes: text('notes'), // Nullable
  recorded_by: integer('recorded_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Violations table
export const violationsTable = pgTable('violations', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  student_id: integer('student_id').notNull().references(() => studentsTable.id),
  type: violationTypeEnum('type').notNull(),
  description: text('description').notNull(),
  severity: violationSeverityEnum('severity').notNull(),
  points: integer('points').notNull(),
  handling_method: handlingMethodEnum('handling_method').notNull(),
  recorded_by: integer('recorded_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Counseling sessions table
export const counselingSessionsTable = pgTable('counseling_sessions', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  student_id: integer('student_id').notNull().references(() => studentsTable.id),
  purpose: text('purpose').notNull(),
  session_summary: text('session_summary').notNull(),
  follow_up_actions: text('follow_up_actions'), // Nullable
  status: counselingStatusEnum('status').notNull(),
  recorded_by: integer('recorded_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  achievements: many(achievementsTable),
  violations: many(violationsTable),
  counselingSessions: many(counselingSessionsTable)
}));

export const studentsRelations = relations(studentsTable, ({ many }) => ({
  achievements: many(achievementsTable),
  violations: many(violationsTable),
  counselingSessions: many(counselingSessionsTable)
}));

export const achievementsRelations = relations(achievementsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [achievementsTable.student_id],
    references: [studentsTable.id]
  }),
  recordedBy: one(usersTable, {
    fields: [achievementsTable.recorded_by],
    references: [usersTable.id]
  })
}));

export const violationsRelations = relations(violationsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [violationsTable.student_id],
    references: [studentsTable.id]
  }),
  recordedBy: one(usersTable, {
    fields: [violationsTable.recorded_by],
    references: [usersTable.id]
  })
}));

export const counselingSessionsRelations = relations(counselingSessionsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [counselingSessionsTable.student_id],
    references: [studentsTable.id]
  }),
  recordedBy: one(usersTable, {
    fields: [counselingSessionsTable.recorded_by],
    references: [usersTable.id]
  })
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Student = typeof studentsTable.$inferSelect;
export type NewStudent = typeof studentsTable.$inferInsert;

export type Achievement = typeof achievementsTable.$inferSelect;
export type NewAchievement = typeof achievementsTable.$inferInsert;

export type Violation = typeof violationsTable.$inferSelect;
export type NewViolation = typeof violationsTable.$inferInsert;

export type CounselingSession = typeof counselingSessionsTable.$inferSelect;
export type NewCounselingSession = typeof counselingSessionsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  students: studentsTable,
  achievements: achievementsTable,
  violations: violationsTable,
  counselingSessions: counselingSessionsTable
};
