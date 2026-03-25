import 'dotenv/config';
import { buildServer } from './server.js';
import { db } from './db.js';
import { redis } from './redis.js';
import { createAuditWorker } from './queue/audit-worker.js';
import { createExpiryWorker } from './queue/expiry-worker.js';
import { crawl } from './crawler/index.js';
import { runAudit } from './scoring/scoring-engine.js';
import { updateAuditStatus, persistAuditResult } from './db/audits.js';
import { deleteExpiredAudits } from './db/emails.js';
import { createEmailService } from './email/resend.js';

const emailService = process.env.RESEND_API_KEY
  ? createEmailService(
      process.env.RESEND_API_KEY,
      process.env.WEB_BASE_URL ?? 'http://localhost:5173'
    )
  : undefined;

// Start audit worker
createAuditWorker(redis, {
  crawl,
  runAudit,
  updateAuditStatus: (id, status) => updateAuditStatus(db, id, status),
  persistAuditResult: (id, result) => persistAuditResult(db, id, result),
});

// Start expiry cron worker
createExpiryWorker({
  deleteExpiredAudits: () => deleteExpiredAudits(db),
}).start(redis);

const app = buildServer(db, redis, emailService);
const port = parseInt(process.env.PORT ?? '3000', 10);

app.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
