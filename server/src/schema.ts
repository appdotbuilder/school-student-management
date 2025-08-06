
import { z } from 'zod';

// Enums
export const userRoleSchema = z.enum(['admin', 'subject_teacher', 'counseling_teacher', 'homeroom_teacher']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const achievementTypeSchema = z.enum(['academic', 'non_academic']);
export type AchievementType = z.infer<typeof achievementTypeSchema>;

export const achievementLevelSchema = z.enum(['school', 'district', 'city', 'province']);
export type AchievementLevel = z.infer<typeof achievementLevelSchema>;

export const violationTypeSchema = z.enum(['discipline', 'attitude', 'uniform', 'attendance', 'academic', 'other']);
export type ViolationType = z.infer<typeof violationTypeSchema>;

export const violationSeveritySchema = z.enum(['light', 'medium', 'heavy']);
export type ViolationSeverity = z.infer<typeof violationSeveritySchema>;

export const handlingMethodSchema = z.enum(['warning', 'parent_call', 'coaching', 'suspension', 'community_service']);
export type HandlingMethod = z.infer<typeof handlingMethodSchema>;

export const counselingStatusSchema = z.enum(['completed', 'needs_follow_up', 'rescheduled']);
export type CounselingStatus = z.infer<typeof counselingStatusSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  full_name: z.string(),
  role: userRoleSchema,
  assigned_class: z.string().nullable(), // For homeroom teachers
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Student schema
export const studentSchema = z.object({
  id: z.number(),
  student_id: z.string(), // Student ID number
  full_name: z.string(),
  class: z.string(),
  grade_level: z.number().int(),
  total_violation_points: z.number().int(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Student = z.infer<typeof studentSchema>;

// Achievement schema
export const achievementSchema = z.object({
  id: z.number(),
  date: z.coerce.date(),
  student_id: z.number(),
  type: achievementTypeSchema,
  activity_description: z.string(),
  level: achievementLevelSchema,
  awarded_by: z.string(),
  notes: z.string().nullable(),
  recorded_by: z.number(), // User ID
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Achievement = z.infer<typeof achievementSchema>;

// Violation schema
export const violationSchema = z.object({
  id: z.number(),
  date: z.coerce.date(),
  student_id: z.number(),
  type: violationTypeSchema,
  description: z.string(),
  severity: violationSeveritySchema,
  points: z.number().int(),
  handling_method: handlingMethodSchema,
  recorded_by: z.number(), // User ID
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Violation = z.infer<typeof violationSchema>;

// Counseling session schema
export const counselingSessionSchema = z.object({
  id: z.number(),
  date: z.coerce.date(),
  student_id: z.number(),
  purpose: z.string(),
  session_summary: z.string(),
  follow_up_actions: z.string().nullable(),
  status: counselingStatusSchema,
  recorded_by: z.number(), // User ID
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type CounselingSession = z.infer<typeof counselingSessionSchema>;

// Input schemas for creating records
export const createUserInputSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  full_name: z.string().min(2),
  role: userRoleSchema,
  assigned_class: z.string().nullable().optional(),
  password: z.string().min(6)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createStudentInputSchema = z.object({
  student_id: z.string().min(1),
  full_name: z.string().min(2),
  class: z.string().min(1),
  grade_level: z.number().int().min(1).max(12)
});

export type CreateStudentInput = z.infer<typeof createStudentInputSchema>;

export const createAchievementInputSchema = z.object({
  date: z.coerce.date(),
  student_id: z.number(),
  type: achievementTypeSchema,
  activity_description: z.string().min(5),
  level: achievementLevelSchema,
  awarded_by: z.string().min(2),
  notes: z.string().nullable().optional()
});

export type CreateAchievementInput = z.infer<typeof createAchievementInputSchema>;

export const createViolationInputSchema = z.object({
  date: z.coerce.date(),
  student_id: z.number(),
  type: violationTypeSchema,
  description: z.string().min(5),
  severity: violationSeveritySchema,
  points: z.number().int().min(1),
  handling_method: handlingMethodSchema
});

export type CreateViolationInput = z.infer<typeof createViolationInputSchema>;

export const createCounselingSessionInputSchema = z.object({
  date: z.coerce.date(),
  student_id: z.number(),
  purpose: z.string().min(5),
  session_summary: z.string().min(10),
  follow_up_actions: z.string().nullable().optional(),
  status: counselingStatusSchema
});

export type CreateCounselingSessionInput = z.infer<typeof createCounselingSessionInputSchema>;

// Update schemas
export const updateUserInputSchema = z.object({
  id: z.number(),
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  full_name: z.string().min(2).optional(),
  role: userRoleSchema.optional(),
  assigned_class: z.string().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const updateStudentInputSchema = z.object({
  id: z.number(),
  student_id: z.string().min(1).optional(),
  full_name: z.string().min(2).optional(),
  class: z.string().min(1).optional(),
  grade_level: z.number().int().min(1).max(12).optional(),
  is_active: z.boolean().optional()
});

export type UpdateStudentInput = z.infer<typeof updateStudentInputSchema>;

// Filter schemas
export const studentFilterSchema = z.object({
  class: z.string().optional(),
  grade_level: z.number().int().optional(),
  is_active: z.boolean().optional()
});

export type StudentFilter = z.infer<typeof studentFilterSchema>;

export const recordFilterSchema = z.object({
  student_id: z.number().optional(),
  class: z.string().optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional()
});

export type RecordFilter = z.infer<typeof recordFilterSchema>;

// Login schema
export const loginInputSchema = z.object({
  username: z.string(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Report generation schema
export const reportInputSchema = z.object({
  type: z.enum(['student', 'class']),
  format: z.enum(['pdf', 'excel']),
  student_id: z.number().optional(),
  class: z.string().optional(),
  date_from: z.coerce.date(),
  date_to: z.coerce.date()
});

export type ReportInput = z.infer<typeof reportInputSchema>;

// Bulk student upload schemas
export const studentUploadRowSchema = z.object({
  student_id: z.string().min(1),
  full_name: z.string().min(2),
  class: z.string().min(1),
  grade_level: z.number().int().min(1).max(12)
});

export type StudentUploadRow = z.infer<typeof studentUploadRowSchema>;

export const studentUploadPreviewSchema = z.object({
  valid_rows: z.array(studentUploadRowSchema),
  invalid_rows: z.array(z.object({
    row_number: z.number(),
    data: z.record(z.unknown()),
    errors: z.array(z.string())
  }))
});

export type StudentUploadPreview = z.infer<typeof studentUploadPreviewSchema>;

export const bulkCreateStudentsInputSchema = z.object({
  students: z.array(studentUploadRowSchema)
});

export type BulkCreateStudentsInput = z.infer<typeof bulkCreateStudentsInputSchema>;
