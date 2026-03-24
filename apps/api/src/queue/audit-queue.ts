import { Queue } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';

export interface AuditJobData {
  auditId: string;
  url: string;
}

export function createAuditQueue(connection: ConnectionOptions) {
  return new Queue<AuditJobData>('audit-jobs', { connection });
}
