import { describe, it, expect, vi } from 'vitest';
import { runAudit } from './scoring-engine.js';
import { makePage, makeCrawlResult } from '../analyzers/test-helpers.js';
// Stub out the async AI answerability analyzer
vi.mock('../analyzers/ai-answerability.js', () => ({
  analyzeAiAnswerability: vi.fn().mockResolvedValue({
    category: 'ai-answerability',
    score: 0,
    maxScore: 10,
    findings: [],
  }),
}));

describe('runAudit', () => {
  it('returns an AuditResult with 8 category scores', async () => {
    const result = await runAudit(makeCrawlResult([]));
    expect(result.categoryScores).toHaveLength(8);
  });

  it('total score is the sum of all category scores', async () => {
    const result = await runAudit(makeCrawlResult([]));
    const sumOfCategories = result.categoryScores.reduce(
      (sum, cs) => sum + cs.score,
      0
    );
    expect(result.score).toBe(sumOfCategories);
  });

  it('max score is 100', async () => {
    const result = await runAudit(makeCrawlResult([]));
    expect(result.maxScore).toBe(100);
  });

  it('includes all 8 categories', async () => {
    const result = await runAudit(makeCrawlResult([]));
    const categories = result.categoryScores.map((cs) => cs.category);
    expect(categories).toContain('entity-definition');
    expect(categories).toContain('content-clarity');
    expect(categories).toContain('topic-authority');
    expect(categories).toContain('semantic-structure');
    expect(categories).toContain('structured-data');
    expect(categories).toContain('ai-crawlability');
    expect(categories).toContain('brand-authority');
    expect(categories).toContain('ai-answerability');
  });

  it('score is 0 on empty crawl', async () => {
    const result = await runAudit(makeCrawlResult([]));
    expect(result.score).toBe(0);
  });

  it('score is higher for a richer site', async () => {
    const pages = [
      makePage({
        url: 'https://example.com',
        h1s: ['Acme Payments'],
        h2s: ['What is Acme?', 'How does it work?'],
        paragraphs: ['Acme is fast.', 'We charge 1%.'],
        markdown: [
          '# Acme Payments',
          '',
          'Acme is a platform that helps SMEs get paid.',
          '',
          'The problem: payments are broken. Our solution is simple.',
          '',
          'Built for small businesses across Africa.',
          '',
          '- Fast transfers',
          '- Low fees',
          '',
          '## What is Acme?',
          '## How does it work?',
        ].join('\n'),
        internalLinks: [
          'https://example.com/about',
          'https://example.com/pricing',
        ],
        externalLinks: [
          'https://twitter.com/acme',
          'https://techcrunch.com/acme',
        ],
        schemaOrg: [{ '@type': 'Organization', name: 'Acme' }],
      }),
      makePage({ url: 'https://example.com/about' }),
      makePage({ url: 'https://example.com/contact' }),
    ];
    const richResult = await runAudit(
      makeCrawlResult(pages, {
        robotsTxt: 'User-agent: *\nDisallow: ',
        llmsTxt: '# Acme',
      })
    );
    const emptyResult = await runAudit(makeCrawlResult([]));
    expect(richResult.score).toBeGreaterThan(emptyResult.score);
  });

  it('score is capped at 100', async () => {
    const result = await runAudit(makeCrawlResult([]));
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('includes findings from all categories', async () => {
    const result = await runAudit(makeCrawlResult([]));
    expect(result.findings.length).toBeGreaterThan(0);
  });
});
