import { describe, it, expect } from 'vitest';
import { analyzeAiCrawlability } from './ai-crawlability.js';
import { makeCrawlResult } from './test-helpers.js';

describe('analyzeAiCrawlability', () => {
  it('returns maxScore=10 and category=ai-crawlability', () => {
    const result = analyzeAiCrawlability(makeCrawlResult([]));
    expect(result.maxScore).toBe(10);
    expect(result.category).toBe('ai-crawlability');
  });

  it('scores 0 total when no robots.txt and no llms.txt', () => {
    const result = analyzeAiCrawlability(
      makeCrawlResult([], { robotsTxt: null, llmsTxt: null })
    );
    expect(result.score).toBe(0);
  });

  it('scores 5 pts when robots.txt does not block any AI bots', () => {
    const result = analyzeAiCrawlability(
      makeCrawlResult([], {
        robotsTxt: 'User-agent: *\nAllow: /',
        llmsTxt: null,
      })
    );
    const finding = result.findings.find(
      (f) => f.signal === 'robots-ai-access'
    );
    expect(finding?.score).toBe(5);
  });

  it('scores 0 for robots-ai-access when robots.txt blocks AI bots', () => {
    const result = analyzeAiCrawlability(
      makeCrawlResult([], {
        robotsTxt: [
          'User-agent: GPTBot',
          'Disallow: /',
          'User-agent: ClaudeBot',
          'Disallow: /',
        ].join('\n'),
        llmsTxt: null,
      })
    );
    const finding = result.findings.find(
      (f) => f.signal === 'robots-ai-access'
    );
    expect(finding?.score).toBe(0);
  });

  it('scores 0 for robots-ai-access when robots.txt is absent', () => {
    const result = analyzeAiCrawlability(
      makeCrawlResult([], { robotsTxt: null, llmsTxt: null })
    );
    const finding = result.findings.find(
      (f) => f.signal === 'robots-ai-access'
    );
    expect(finding?.score).toBe(0);
  });

  it('scores 5 pts when llms.txt file is present', () => {
    const result = analyzeAiCrawlability(
      makeCrawlResult([], {
        robotsTxt: null,
        llmsTxt: '# Acme\n\nAcme is a payments platform.',
      })
    );
    const finding = result.findings.find((f) => f.signal === 'llms-txt');
    expect(finding?.score).toBe(5);
  });

  it('scores 0 for llms-txt when not present', () => {
    const result = analyzeAiCrawlability(
      makeCrawlResult([], { robotsTxt: null, llmsTxt: null })
    );
    const finding = result.findings.find((f) => f.signal === 'llms-txt');
    expect(finding?.score).toBe(0);
  });

  it('scores 10 total when robots.txt allows AI bots and llms.txt is present', () => {
    const result = analyzeAiCrawlability(
      makeCrawlResult([], {
        robotsTxt: 'User-agent: *\nAllow: /',
        llmsTxt: '# Acme\n\nThe payments company for Africa.',
      })
    );
    expect(result.score).toBe(10);
  });
});
