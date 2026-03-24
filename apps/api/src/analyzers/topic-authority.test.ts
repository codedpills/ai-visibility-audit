import { describe, it, expect } from 'vitest';
import { analyzeTopicAuthority } from './topic-authority.js';
import { makePage, makeCrawlResult } from './test-helpers.js';

describe('analyzeTopicAuthority', () => {
  it('returns maxScore=15 and category=topic-authority', () => {
    const result = analyzeTopicAuthority(makeCrawlResult([]));
    expect(result.maxScore).toBe(15);
    expect(result.category).toBe('topic-authority');
  });

  it('scores 0 total on an empty crawl result', () => {
    const result = analyzeTopicAuthority(makeCrawlResult([]));
    expect(result.score).toBe(0);
  });

  it('scores 5 pts when site has 5+ crawled pages (depth)', () => {
    const pages = Array.from({ length: 5 }, (_, i) =>
      makePage({ url: `https://example.com/page-${i}` })
    );
    const result = analyzeTopicAuthority(makeCrawlResult(pages));
    const finding = result.findings.find((f) => f.signal === 'page-depth');
    expect(finding?.score).toBe(5);
  });

  it('scores 0 for page-depth when fewer than 3 pages', () => {
    const pages = [makePage({ url: 'https://example.com' })];
    const result = analyzeTopicAuthority(makeCrawlResult(pages));
    const finding = result.findings.find((f) => f.signal === 'page-depth');
    expect(finding?.score).toBe(0);
  });

  it('scores 5 pts when site has a blog or resources section', () => {
    const page = makePage({
      url: 'https://example.com/blog/how-to-send-money',
      markdown: '# How to send money internationally',
    });
    const result = analyzeTopicAuthority(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'blog-content');
    expect(finding?.score).toBe(5);
  });

  it('scores 0 for blog-content when no blog/resources pages found', () => {
    const pages = [
      makePage({ url: 'https://example.com' }),
      makePage({ url: 'https://example.com/pricing' }),
    ];
    const result = analyzeTopicAuthority(makeCrawlResult(pages));
    const finding = result.findings.find((f) => f.signal === 'blog-content');
    expect(finding?.score).toBe(0);
  });

  it('scores 5 pts when pages have strong internal linking (avg ≥1 internal link)', () => {
    const pages = [
      makePage({
        url: 'https://example.com',
        internalLinks: [
          'https://example.com/about',
          'https://example.com/pricing',
          'https://example.com/blog',
        ],
      }),
      makePage({
        url: 'https://example.com/about',
        internalLinks: ['https://example.com', 'https://example.com/pricing'],
      }),
    ];
    const result = analyzeTopicAuthority(makeCrawlResult(pages));
    const finding = result.findings.find(
      (f) => f.signal === 'internal-linking'
    );
    expect(finding?.score).toBe(5);
  });

  it('scores 0 for internal-linking when pages have no internal links', () => {
    const pages = [makePage({ url: 'https://example.com', internalLinks: [] })];
    const result = analyzeTopicAuthority(makeCrawlResult(pages));
    const finding = result.findings.find(
      (f) => f.signal === 'internal-linking'
    );
    expect(finding?.score).toBe(0);
  });

  it('scores 15 total on a fully-featured site', () => {
    const pages = [
      makePage({
        url: 'https://example.com',
        internalLinks: [
          'https://example.com/blog',
          'https://example.com/pricing',
          'https://example.com/about',
        ],
      }),
      makePage({
        url: 'https://example.com/blog/post-1',
        internalLinks: ['https://example.com'],
      }),
      makePage({
        url: 'https://example.com/blog/post-2',
        internalLinks: ['https://example.com'],
      }),
      makePage({
        url: 'https://example.com/pricing',
        internalLinks: ['https://example.com'],
      }),
      makePage({
        url: 'https://example.com/about',
        internalLinks: ['https://example.com'],
      }),
    ];
    const result = analyzeTopicAuthority(makeCrawlResult(pages));
    expect(result.score).toBe(15);
  });
});
