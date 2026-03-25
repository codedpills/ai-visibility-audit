import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoute } from './routes/health.js';
import { auditsRoute } from './routes/audits.js';
import { emailRoute } from './routes/email.js';
import { createAuditQueue } from './queue/audit-queue.js';
import { createAuditRecord, getAuditById } from './db/audits.js';
import { saveAuditEmail } from './db/emails.js';
import type { Kysely } from 'kysely';
import type { Database } from './types/database.js';
import type { ConnectionOptions } from 'bullmq';
import type { EmailService } from './email/resend.js';

export function buildServer(
  db: Kysely<Database>,
  redisClient: ConnectionOptions,
  emailService?: EmailService
) {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  });

  const auditQueue = createAuditQueue(redisClient);

  app.register(cors);
  app.register(healthRoute);
  app.register(auditsRoute, {
    enqueueAudit: async (url: string) => {
      const auditId = await createAuditRecord(db, url);
      await auditQueue.add('audit' as never, { auditId, url });
      return auditId;
    },
    getAudit: (id: string) => getAuditById(db, id),
  });

  app.register(emailRoute, {
    getAudit: (id: string) => getAuditById(db, id),
    saveEmail: (auditId: string, email: string) =>
      saveAuditEmail(db, auditId, email),
    sendConfirmationEmail: async (email: string, auditId: string) => {
      await emailService?.sendConfirmationEmail(email, auditId);
    },
  });

  return app;
}
