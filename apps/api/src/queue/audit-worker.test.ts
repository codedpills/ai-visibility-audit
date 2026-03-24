import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processAuditJob } from './audit-worker.js';
import type { AuditJobData } from './audit-queue.js';

// --- Mocks ---

const mockCrawl = vi.fn();
const mockRunAudit = vi.fn();
const mockUpdateStatus = vi.fn();
const mockPersistResult = vi.fn();

const deps = {
  crawl: mockCrawl,
  runAudit: mockRunAudit,
  updateAuditStatus: mockUpdateStatus,
  persistAuditResult: mockPersistResult,
};

const jobData: AuditJobData = {
  auditId: 'audit-123',
  url: 'https://example.com',
};

const fakeCrawlResult = {
  domain: 'https://example.com',
  pages: [],
  robotsTxt: null,
  llmsTxt: null,
};

const fakeScoringResult = {
  score: 42,
  maxScore: 100,
  categoryScores: [],
  findings: [],
  recommendations: [],
};

describe('processAuditJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCrawl.mockResolvedValue(fakeCrawlResult);
    mockRunAudit.mockResolvedValue(fakeScoringResult);
    mockUpdateStatus.mockResolvedValue(undefined);
    mockPersistResult.mockResolvedValue(undefined);
  });

  it('sets status to running, then done on success', async () => {
    await processAuditJob(jobData, deps);

    expect(mockUpdateStatus).toHaveBeenCalledWith('audit-123', 'running');
    expect(mockUpdateStatus).toHaveBeenCalledWith('audit-123', 'done');
    expect(mockUpdateStatus).toHaveBeenCalledTimes(2);
  });

  it('calls crawl with the job url', async () => {
    await processAuditJob(jobData, deps);
    expect(mockCrawl).toHaveBeenCalledWith('https://example.com');
  });

  it('calls runAudit with the crawl result', async () => {
    await processAuditJob(jobData, deps);
    expect(mockRunAudit).toHaveBeenCalledWith(fakeCrawlResult);
  });

  it('calls persistAuditResult with audit id and scoring result', async () => {
    await processAuditJob(jobData, deps);
    expect(mockPersistResult).toHaveBeenCalledWith(
      'audit-123',
      fakeScoringResult
    );
  });

  it('sets status to failed and does not persist when crawl throws', async () => {
    mockCrawl.mockRejectedValue(new Error('Crawl failed'));
    await processAuditJob(jobData, deps);

    expect(mockUpdateStatus).toHaveBeenCalledWith('audit-123', 'running');
    expect(mockUpdateStatus).toHaveBeenCalledWith('audit-123', 'failed');
    expect(mockPersistResult).not.toHaveBeenCalled();
  });

  it('sets status to failed when runAudit throws', async () => {
    mockRunAudit.mockRejectedValue(new Error('Score failed'));
    await processAuditJob(jobData, deps);

    expect(mockUpdateStatus).toHaveBeenCalledWith('audit-123', 'failed');
    expect(mockPersistResult).not.toHaveBeenCalled();
  });
});
