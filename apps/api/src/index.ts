import 'dotenv/config';
import { buildServer } from './server.js';
import { db } from './db.js';
import { redis } from './redis.js';
import { createAuditWorker } from './queue/audit-worker.js';
import { crawl } from './crawler/index.js';
import { runAudit } from './scoring/scoring-engine.js';
import { updateAuditStatus, persistAuditResult } from './db/audits.js';

// Start worker
createAuditWorker(redis, {
  crawl,
  runAudit,
  updateAuditStatus: (id, status) => updateAuditStatus(db, id, status),
  persistAuditResult: (id, result) => persistAuditResult(db, id, result),
});

const app = buildServer(db, redis);
const port = parseInt(process.env.PORT ?? '3000', 10);

app.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
