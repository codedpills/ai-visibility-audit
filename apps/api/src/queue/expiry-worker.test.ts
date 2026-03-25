import { describe, it, expect, vi } from 'vitest';
import { createExpiryWorker } from './expiry-worker.js';

describe('createExpiryWorker', () => {
  it('calls deleteExpiredAudits when the job fires', async () => {
    const deleteExpiredAudits = vi.fn().mockResolvedValue(undefined);
    const worker = createExpiryWorker({ deleteExpiredAudits });
    await worker.runJob();
    expect(deleteExpiredAudits).toHaveBeenCalledOnce();
  });
});
