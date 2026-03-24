import type { AuditJobData } from './audit-queue.js';
import type { CrawlResult } from '../crawler/types.js';
import type { ScoringResult } from '../scoring/types.js';
import type { AuditStatus } from '@repo/shared';
import { Worker } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';

export interface WorkerDeps {
  crawl: (url: string) => Promise<CrawlResult>;
  runAudit: (crawlResult: CrawlResult) => Promise<ScoringResult>;
  updateAuditStatus: (auditId: string, status: AuditStatus) => Promise<void>;
  persistAuditResult: (auditId: string, result: ScoringResult) => Promise<void>;
}

export async function processAuditJob(
  data: AuditJobData,
  deps: WorkerDeps
): Promise<void> {
  const { auditId, url } = data;
  const { crawl, runAudit, updateAuditStatus, persistAuditResult } = deps;

  await updateAuditStatus(auditId, 'running');

  try {
    const crawlResult = await crawl(url);
    const scoringResult = await runAudit(crawlResult);
    await persistAuditResult(auditId, scoringResult);
    await updateAuditStatus(auditId, 'done');
  } catch {
    await updateAuditStatus(auditId, 'failed');
  }
}

export function createAuditWorker(
  connection: ConnectionOptions,
  deps: WorkerDeps
) {
  return new Worker<AuditJobData>(
    'audit-jobs',
    async (job) => {
      await processAuditJob(job.data, deps);
    },
    { connection }
  );
}
