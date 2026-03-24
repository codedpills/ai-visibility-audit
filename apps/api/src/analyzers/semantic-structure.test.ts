import { describe, it, expect } from 'vitest';
import { analyzeSemanticStructure } from './semantic-structure.js';
import { makePage, makeCrawlResult } from './test-helpers.js';

describe('analyzeSemanticStructure', () => {
  it('returns maxScore=10 and category=semantic-structure', () => {
    const result = analyzeSemanticStructure(makeCrawlResult([]));
    expect(result.maxScore).toBe(10);
    expect(result.category).toBe('semantic-structure');
  });

  it('scores 0 total on an empty crawl result', () => {
    const result = analyzeSemanticStructure(makeCrawlResult([]));
    expect(result.score).toBe(0);
  });

  it('scores 4 pts when pages have exactly one H1', () => {
    const page = makePage({
      url: 'https://example.com',
      h1s: ['Acme — Send Money Across Africa'],
    });
    const result = analyzeSemanticStructure(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'single-h1');
    expect(finding?.score).toBe(4);
  });

  it('scores 0 for single-h1 when page has zero or multiple H1s', () => {
    const zeroH1 = makePage({ url: 'https://example.com', h1s: [] });
    const multiH1 = makePage({
      url: 'https://example.com',
      h1s: ['Heading One', 'Heading Two'],
    });
    const r1 = analyzeSemanticStructure(makeCrawlResult([zeroH1]));
    const r2 = analyzeSemanticStructure(makeCrawlResult([multiH1]));
    expect(r1.findings.find((f) => f.signal === 'single-h1')?.score).toBe(0);
    expect(r2.findings.find((f) => f.signal === 'single-h1')?.score).toBe(0);
  });

  it('scores 3 pts when H2s are phrased as questions', () => {
    const page = makePage({
      url: 'https://example.com',
      h2s: ['What is Acme?', 'How does pricing work?', 'Who is it for?'],
    });
    const result = analyzeSemanticStructure(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'h2-as-questions');
    expect(finding?.score).toBe(3);
  });

  it('scores 0 for h2-as-questions when no question headings', () => {
    const page = makePage({
      url: 'https://example.com',
      h2s: ['Features', 'Pricing', 'Team'],
    });
    const result = analyzeSemanticStructure(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'h2-as-questions');
    expect(finding?.score).toBe(0);
  });

  it('scores 3 pts when average paragraph word count is ≤80', () => {
    const page = makePage({
      url: 'https://example.com',
      paragraphs: ['Short text here.', 'Another short one.'],
    });
    const result = analyzeSemanticStructure(makeCrawlResult([page]));
    const finding = result.findings.find(
      (f) => f.signal === 'paragraph-length'
    );
    expect(finding?.score).toBe(3);
  });

  it('scores 0 for paragraph-length when paragraphs are too long', () => {
    const longText = 'word '.repeat(100).trim();
    const page = makePage({
      url: 'https://example.com',
      paragraphs: [longText],
    });
    const result = analyzeSemanticStructure(makeCrawlResult([page]));
    const finding = result.findings.find(
      (f) => f.signal === 'paragraph-length'
    );
    expect(finding?.score).toBe(0);
  });

  it('scores 10 total on a fully-structured page', () => {
    const page = makePage({
      url: 'https://example.com',
      h1s: ['Acme — Payments for Africa'],
      h2s: ['What is Acme?', 'How does it work?'],
      paragraphs: ['We help businesses.', 'Fast and simple.'],
    });
    const result = analyzeSemanticStructure(makeCrawlResult([page]));
    expect(result.score).toBe(10);
  });
});
