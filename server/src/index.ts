
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schema imports
import {
  createUserInputSchema,
  updateUserInputSchema,
  createStudentInputSchema,
  updateStudentInputSchema,
  createAchievementInputSchema,
  createViolationInputSchema,
  createCounselingSessionInputSchema,
  studentFilterSchema,
  recordFilterSchema,
  loginInputSchema,
  reportInputSchema,
  userRoleSchema,
  counselingStatusSchema
} from './schema';

// Handler imports
import { createUser } from './handlers/create_user';
import { getUsers, getUsersByRole } from './handlers/get_users';
import { updateUser } from './handlers/update_user';
import { deleteUser } from './handlers/delete_user';
import { createStudent } from './handlers/create_student';
import { getStudents, getStudentById, getStudentsByClass } from './handlers/get_students';
import { updateStudent } from './handlers/update_student';
import { createAchievement } from './handlers/create_achievement';
import { getAchievements, getAchievementsByStudent, getAchievementsByClass } from './handlers/get_achievements';
import { createViolation } from './handlers/create_violation';
import { getViolations, getViolationsByStudent, getViolationsByClass } from './handlers/get_violations';
import { createCounselingSession } from './handlers/create_counseling_session';
import { getCounselingSessions, getCounselingSessionsByStudent, getPendingFollowUps } from './handlers/get_counseling_sessions';
import { updateCounselingSessionStatus } from './handlers/update_counseling_session';
import { loginUser, getCurrentUser, changePassword } from './handlers/auth';
import { generateReport, generateClassReport, generateStudentSummary } from './handlers/reports';
import { getDashboardData, getNotifications } from './handlers/dashboard';

// Define context type
type Context = {
  userId?: number;
  userRole?: string;
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  getCurrentUser: publicProcedure
    .input(z.string())
    .query(({ input }) => getCurrentUser(input)),

  changePassword: publicProcedure
    .input(z.object({
      oldPassword: z.string(),
      newPassword: z.string().min(6)
    }))
    .mutation(({ input, ctx }) => changePassword(ctx.userId || 1, input.oldPassword, input.newPassword)),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  getUsers: publicProcedure
    .query(() => getUsers()),

  getUsersByRole: publicProcedure
    .input(userRoleSchema)
    .query(({ input }) => getUsersByRole(input)),

  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  deleteUser: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteUser(input)),

  // Student management
  createStudent: publicProcedure
    .input(createStudentInputSchema)
    .mutation(({ input }) => createStudent(input)),

  getStudents: publicProcedure
    .input(studentFilterSchema.optional())
    .query(({ input }) => getStudents(input)),

  getStudentById: publicProcedure
    .input(z.number())
    .query(({ input }) => getStudentById(input)),

  getStudentsByClass: publicProcedure
    .input(z.string())
    .query(({ input }) => getStudentsByClass(input)),

  updateStudent: publicProcedure
    .input(updateStudentInputSchema)
    .mutation(({ input }) => updateStudent(input)),

  // Achievement management
  createAchievement: publicProcedure
    .input(createAchievementInputSchema)
    .mutation(({ input, ctx }) => createAchievement(input, ctx.userId || 1)),

  getAchievements: publicProcedure
    .input(recordFilterSchema.optional())
    .query(({ input }) => getAchievements(input)),

  getAchievementsByStudent: publicProcedure
    .input(z.number())
    .query(({ input }) => getAchievementsByStudent(input)),

  getAchievementsByClass: publicProcedure
    .input(z.object({
      className: z.string(),
      filter: recordFilterSchema.optional()
    }))
    .query(({ input }) => getAchievementsByClass(input.className, input.filter)),

  // Violation management
  createViolation: publicProcedure
    .input(createViolationInputSchema)
    .mutation(({ input, ctx }) => createViolation(input, ctx.userId || 1)),

  getViolations: publicProcedure
    .input(recordFilterSchema.optional())
    .query(({ input }) => getViolations(input)),

  getViolationsByStudent: publicProcedure
    .input(z.number())
    .query(({ input }) => getViolationsByStudent(input)),

  getViolationsByClass: publicProcedure
    .input(z.object({
      className: z.string(),
      filter: recordFilterSchema.optional()
    }))
    .query(({ input }) => getViolationsByClass(input.className, input.filter)),

  // Counseling session management
  createCounselingSession: publicProcedure
    .input(createCounselingSessionInputSchema)
    .mutation(({ input, ctx }) => createCounselingSession(input, ctx.userId || 1)),

  getCounselingSessions: publicProcedure
    .input(recordFilterSchema.optional())
    .query(({ input }) => getCounselingSessions(input)),

  getCounselingSessionsByStudent: publicProcedure
    .input(z.number())
    .query(({ input }) => getCounselingSessionsByStudent(input)),

  getPendingFollowUps: publicProcedure
    .query(() => getPendingFollowUps()),

  updateCounselingSessionStatus: publicProcedure
    .input(z.object({
      id: z.number(),
      status: counselingStatusSchema
    }))
    .mutation(({ input }) => updateCounselingSessionStatus(input.id, input.status)),

  // Reports
  generateReport: publicProcedure
    .input(reportInputSchema)
    .mutation(({ input }) => generateReport(input)),

  generateClassReport: publicProcedure
    .input(z.object({
      className: z.string(),
      dateFrom: z.coerce.date(),
      dateTo: z.coerce.date(),
      format: z.enum(['pdf', 'excel'])
    }))
    .mutation(({ input }) => generateClassReport(input.className, input.dateFrom, input.dateTo, input.format)),

  generateStudentSummary: publicProcedure
    .input(z.number())
    .query(({ input }) => generateStudentSummary(input)),

  // Dashboard
  getDashboardData: publicProcedure
    .input(userRoleSchema)
    .query(({ input, ctx }) => getDashboardData(ctx.userId || 1, input)),

  getNotifications: publicProcedure
    .input(userRoleSchema)
    .query(({ input, ctx }) => getNotifications(ctx.userId || 1, input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext(): Context {
      // This should be enhanced with proper authentication context
      // In a real implementation, you would:
      // 1. Extract JWT token from Authorization header
      // 2. Validate the token and get user info
      // 3. Return the actual userId and userRole
      return {
        userId: 1, // Placeholder - should come from JWT token validation
        userRole: 'admin' // Placeholder - should come from JWT token validation
      };
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
