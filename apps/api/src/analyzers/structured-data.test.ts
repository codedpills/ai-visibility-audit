import { describe, it, expect } from 'vitest';
import { analyzeStructuredData } from './structured-data.js';
import { makePage, makeCrawlResult } from './test-helpers.js';

describe('analyzeStructuredData', () => {
  it('returns maxScore=10 and category=structured-data', () => {
    const result = analyzeStructuredData(makeCrawlResult([]));
    expect(result.maxScore).toBe(10);
    expect(result.category).toBe('structured-data');
  });

  it('scores 0 total on an empty crawl result', () => {
    const result = analyzeStructuredData(makeCrawlResult([]));
    expect(result.score).toBe(0);
  });

  it('scores 2 pts for Organization schema', () => {
    const page = makePage({
      url: 'https://example.com',
      schemaOrg: [{ '@type': 'Organization', name: 'Acme' }],
    });
    const result = analyzeStructuredData(makeCrawlResult([page]));
    const finding = result.findings.find(
      (f) => f.signal === 'organization-schema'
    );
    expect(finding?.score).toBe(2);
  });

  it('scores 2 pts for Product schema', () => {
    const page = makePage({
      url: 'https://example.com',
      schemaOrg: [{ '@type': 'Product', name: 'Acme Payments API' }],
    });
    const result = analyzeStructuredData(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'product-schema');
    expect(finding?.score).toBe(2);
  });

  it('scores 2 pts for Article/BlogPosting schema', () => {
    const page = makePage({
      url: 'https://example.com/blog/post',
      schemaOrg: [{ '@type': 'Article', headline: 'How to send money' }],
    });
    const result = analyzeStructuredData(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'article-schema');
    expect(finding?.score).toBe(2);
  });

  it('scores 2 pts for FAQPage schema', () => {
    const page = makePage({
      url: 'https://example.com/faq',
      schemaOrg: [{ '@type': 'FAQPage', mainEntity: [] }],
    });
    const result = analyzeStructuredData(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'faq-schema');
    expect(finding?.score).toBe(2);
  });

  it('scores 2 pts for HowTo schema', () => {
    const page = makePage({
      url: 'https://example.com/guide',
      schemaOrg: [{ '@type': 'HowTo', name: 'How to integrate' }],
    });
    const result = analyzeStructuredData(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'howto-schema');
    expect(finding?.score).toBe(2);
  });

  it('scores 0 for each schema type when absent', () => {
    const page = makePage({ url: 'https://example.com', schemaOrg: [] });
    const result = analyzeStructuredData(makeCrawlResult([page]));
    expect(result.score).toBe(0);
  });

  it('scores 10 total when all 5 schema types are present', () => {
    const pages = [
      makePage({
        url: 'https://example.com',
        schemaOrg: [
          { '@type': 'Organization', name: 'Acme' },
          { '@type': 'Product', name: 'Acme API' },
        ],
      }),
      makePage({
        url: 'https://example.com/blog/post',
        schemaOrg: [{ '@type': 'Article', headline: 'Guide' }],
      }),
      makePage({
        url: 'https://example.com/faq',
        schemaOrg: [{ '@type': 'FAQPage' }],
      }),
      makePage({
        url: 'https://example.com/guide',
        schemaOrg: [{ '@type': 'HowTo', name: 'How to integrate' }],
      }),
    ];
    const result = analyzeStructuredData(makeCrawlResult(pages));
    expect(result.score).toBe(10);
  });
});
