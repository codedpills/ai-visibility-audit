import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { healthRoute } from './routes/health.js';
import { auditsRoute } from './routes/audits.js';
import { emailRoute } from './routes/email.js';
import { authRoute } from './routes/auth.js';
import { kofiRoute } from './routes/kofi.js';
import { usersRoute } from './routes/users.js';
import { createAuditQueue } from './queue/audit-queue.js';
import {
  createAuditRecord,
  getAuditById,
  getAuditsByUserId,
} from './db/audits.js';
import { saveAuditEmail } from './db/emails.js';
import {
  upsertUser,
  findUserById,
  findUserByEmail,
  saveMagicLink,
  verifyMagicLink,
  recordDonation,
  incrementAuditCount,
} from './db/users.js';
import { generateMagicToken, hashToken } from './auth/magic-link.js';
import {
  checkAnonLimit,
  checkRegisteredLimit,
} from './middleware/rate-limit.js';
import type { Kysely } from 'kysely';
import type { Database } from './types/database.js';
import type { ConnectionOptions } from 'bullmq';
import type { Redis } from 'ioredis';
import type { EmailService } from './email/resend.js';

export function buildServer(
  db: Kysely<Database>,
  redisClient: ConnectionOptions,
  emailService?: EmailService,
  redis?: Redis
) {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  });

  const auditQueue = createAuditQueue(redisClient);
  const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
  const monthlyLimit = parseInt(process.env.MONTHLY_AUDIT_LIMIT ?? '3', 10);
  const anonDailyLimit = parseInt(process.env.ANON_DAILY_LIMIT ?? '1', 10);
  const webBaseUrl = process.env.WEB_BASE_URL ?? 'http://localhost:5173';

  app.register(cors);
  app.register(cookie);
  app.register(healthRoute);
  app.register(auditsRoute, {
    enqueueAudit: async (url: string, userId?: string | null) => {
      const auditId = await createAuditRecord(db, url, userId);
      await auditQueue.add('audit' as never, { auditId, url });
      return auditId;
    },
    getAudit: (id: string) => getAuditById(db, id),
    jwtSecret,
    checkAnon: (anonId, ip) =>
      checkAnonLimit(redis!, anonId, ip, undefined, anonDailyLimit),
    checkRegistered: (userId) => checkRegisteredLimit(db, userId, monthlyLimit),
    incrementUserAuditCount: (userId) => incrementAuditCount(db, userId),
  });

  app.register(emailRoute, {
    getAudit: (id: string) => getAuditById(db, id),
    saveEmail: (auditId: string, email: string) =>
      saveAuditEmail(db, auditId, email),
    sendConfirmationEmail: async (email: string, auditId: string) => {
      await emailService?.sendConfirmationEmail(email, auditId);
    },
  });

  // Auth routes
  app.register(authRoute, {
    upsertUser: (_, email) => upsertUser(db, email),
    findUserById: (_, id) => findUserById(db, id),
    saveMagicLink: (_, userId, hash, expiresAt) =>
      saveMagicLink(db, userId, hash, expiresAt),
    verifyMagicLink: (_, hash) => verifyMagicLink(db, hash),
    sendMagicLinkEmail: async (email: string, token: string) => {
      const link = `${webBaseUrl}/auth/verify?token=${token}`;
      await emailService?.sendMagicLinkEmail?.(email, link);
    },
    generateToken: generateMagicToken,
    hashToken,
    jwtSecret,
    monthlyLimit,
  });

  app.register(kofiRoute, {
    findUserByEmail: (_, email) => findUserByEmail(db, email),
    recordDonation: (_, userId, points) => recordDonation(db, userId, points),
    verificationToken: process.env.KOFI_VERIFICATION_TOKEN ?? '',
    db,
  });

  app.register(usersRoute, {
    jwtSecret,
    getAuditsByUser: (userId) => getAuditsByUserId(db, userId),
  });

  return app;
}
