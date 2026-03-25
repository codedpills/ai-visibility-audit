import { Worker, Queue } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';

const QUEUE_NAME = 'expiry-jobs';
const JOB_NAME = 'delete-expired-audits';
// Run daily at 02:00 UTC
const CRON_PATTERN = '0 2 * * *';

export interface ExpiryWorkerDeps {
  deleteExpiredAudits: () => Promise<void>;
}

export interface ExpiryWorker {
  runJob: () => Promise<void>;
  start: (connection: ConnectionOptions) => { worker: Worker; queue: Queue };
}

export function createExpiryWorker(deps: ExpiryWorkerDeps): ExpiryWorker {
  const { deleteExpiredAudits } = deps;

  async function runJob(): Promise<void> {
    await deleteExpiredAudits();
  }

  function start(connection: ConnectionOptions) {
    const queue = new Queue(QUEUE_NAME, { connection });

    // Register the repeatable job (idempotent — BullMQ deduplicates by key)
    queue.add(JOB_NAME, {}, { repeat: { pattern: CRON_PATTERN } });

    const worker = new Worker(QUEUE_NAME, async () => runJob(), { connection });

    return { worker, queue };
  }

  return { runJob, start };
}
