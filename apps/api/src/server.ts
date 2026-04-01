import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
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
  linkAuditToUser,
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
    trustProxy: true,
  });

  // Fail fast: JWT_SECRET must be set explicitly — no insecure default in production
  const rawJwtSecret = process.env.JWT_SECRET;
  if (!rawJwtSecret) {
    throw new Error(
      'JWT_SECRET environment variable is required but not set. ' +
        'Set it to a strong random value (32+ chars).'
    );
  }
  if (rawJwtSecret === 'dev-secret-change-in-production') {
    app.log.warn(
      'JWT_SECRET is set to the insecure default value. Change it in production.'
    );
  }

  // Warn (not throw) for optional services — degraded mode is acceptable
  if (!process.env.FIRECRAWL_API_KEY) {
    app.log.warn('FIRECRAWL_API_KEY is not set — crawl jobs will fail');
  }

  const auditQueue = createAuditQueue(redisClient);
  const jwtSecret = rawJwtSecret;
  const monthlyLimit = parseInt(process.env.MONTHLY_AUDIT_LIMIT ?? '3', 10);
  const anonMonthlyLimit = parseInt(process.env.ANON_MONTHLY_LIMIT ?? '1', 10);
  const webBaseUrl = process.env.WEB_BASE_URL ?? 'http://localhost:5173';
  // Support comma-separated list of allowed origins so both the custom domain
  // (e.g. https://aivisibilityaudit.cc) and the Railway deploy URL work simultaneously.
  const allowedOrigins = webBaseUrl.split(',').map((o) => o.trim());
  // Use the first (canonical) origin for link generation in emails.
  const primaryWebUrl = allowedOrigins[0];

  app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no Origin header (e.g. server-to-server, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
    },
    credentials: true,
  });
  // Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, etc.
  app.register(helmet, { global: true });
  // Rate limiting for auth and email endpoints — applied per-route below
  app.register(rateLimit, {
    global: false, // only apply where explicitly enabled
    redis: redis as never, // share infrastructure when Redis is available
  });
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
      checkAnonLimit(redis!, anonId, ip, undefined, anonMonthlyLimit),
    checkRegistered: (userId) => checkRegisteredLimit(db, userId, monthlyLimit),
    incrementUserAuditCount: (userId) => incrementAuditCount(db, userId),
  });

  app.register(emailRoute, {
    getAudit: (id: string) => getAuditById(db, id),
    saveEmail: (auditId: string, email: string) =>
      saveAuditEmail(db, auditId, email),
    upsertUser: (email: string) => upsertUser(db, email),
    generateToken: generateMagicToken,
    hashToken,
    saveMagicLink: (userId: string, hash: string, expiresAt: Date) =>
      saveMagicLink(db, userId, hash, expiresAt),
    sendResultsMagicLinkEmail: async (email: string, link: string) => {
      await emailService?.sendResultsMagicLinkEmail(email, link);
    },
    linkAuditToUser: (auditId: string, userId: string) =>
      linkAuditToUser(db, auditId, userId),
    incrementUserAuditCount: (userId: string) =>
      incrementAuditCount(db, userId),
    webBaseUrl: primaryWebUrl,
  });

  // Auth routes
  app.register(authRoute, {
    upsertUser: (_, email) => upsertUser(db, email),
    findUserById: (_, id) => findUserById(db, id),
    saveMagicLink: (_, userId, hash, expiresAt) =>
      saveMagicLink(db, userId, hash, expiresAt),
    verifyMagicLink: (_, hash) => verifyMagicLink(db, hash),
    sendMagicLinkEmail: async (email: string, token: string) => {
      const link = `${primaryWebUrl}/auth/verify?token=${token}`;
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

  // Public config — exposes rate-limit values so the frontend can render them dynamically
  app.get('/config', async (_req, reply) => {
    return reply.send({ monthlyLimit, anonMonthlyLimit });
  });

  return app;
}
