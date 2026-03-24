import { describe, it, expect } from 'vitest';
import { analyzeContentClarity } from './content-clarity.js';
import { makePage, makeCrawlResult } from './test-helpers.js';

describe('analyzeContentClarity', () => {
  it('returns maxScore=15 and category=content-clarity', () => {
    const result = analyzeContentClarity(makeCrawlResult([]));
    expect(result.maxScore).toBe(15);
    expect(result.category).toBe('content-clarity');
  });

  it('scores 0 total on an empty crawl result', () => {
    const result = analyzeContentClarity(makeCrawlResult([]));
    expect(result.score).toBe(0);
  });

  it('scores 4 pts when site has bullet/numbered lists', () => {
    const page = makePage({
      url: 'https://example.com',
      markdown: [
        '# Features',
        '',
        '- Accept payments',
        '- Manage invoices',
        '- Track revenue',
      ].join('\n'),
    });
    const result = analyzeContentClarity(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'bullet-lists');
    expect(finding?.score).toBe(4);
  });

  it('scores 0 for bullet-lists when no lists present', () => {
    const page = makePage({
      url: 'https://example.com',
      markdown: '# Acme\n\nWe do many things.',
    });
    const result = analyzeContentClarity(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'bullet-lists');
    expect(finding?.score).toBe(0);
  });

  it('scores 4 pts when site has a FAQ section', () => {
    const page = makePage({
      url: 'https://example.com/faq',
      markdown: [
        '# FAQ',
        '',
        '## What is Acme?',
        'Acme is a payments platform.',
        '',
        '## How does pricing work?',
        'We charge a flat 1% per transaction.',
      ].join('\n'),
    });
    const result = analyzeContentClarity(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'faq-section');
    expect(finding?.score).toBe(4);
  });

  it('scores 0 for faq-section when none present', () => {
    const page = makePage({
      url: 'https://example.com',
      markdown: '# Acme\n\nNo questions here.',
    });
    const result = analyzeContentClarity(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'faq-section');
    expect(finding?.score).toBe(0);
  });

  it('scores 4 pts when homepage has a plain-language summary', () => {
    const page = makePage({
      url: 'https://example.com',
      markdown:
        '# Acme\n\nAcme lets you send and receive money across borders in seconds.',
      paragraphs: [
        'Acme lets you send and receive money across borders in seconds.',
      ],
    });
    const result = analyzeContentClarity(makeCrawlResult([page]));
    const finding = result.findings.find(
      (f) => f.signal === 'plain-language-summary'
    );
    expect(finding?.score).toBe(4);
  });

  it('scores 3 pts for short average paragraph length (readability)', () => {
    const page = makePage({
      url: 'https://example.com',
      paragraphs: [
        'Acme is fast.',
        'We charge 1%.',
        'Sign up free.',
        'No lock-in.',
      ],
    });
    const result = analyzeContentClarity(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'readability');
    expect(finding?.score).toBe(3);
  });

  it('scores 0 for readability when paragraphs are very long', () => {
    const longText = 'word '.repeat(120).trim();
    const page = makePage({
      url: 'https://example.com',
      paragraphs: [longText, longText],
    });
    const result = analyzeContentClarity(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'readability');
    expect(finding?.score).toBe(0);
  });

  it('scores 15 total on a fully-featured site', () => {
    const homepage = makePage({
      url: 'https://example.com',
      markdown: [
        '# Acme',
        '',
        'Acme lets you send money across Africa in seconds.',
        '',
        '## Key features',
        '- Fast transfers',
        '- Low fees',
        '- Simple API',
      ].join('\n'),
      paragraphs: [
        'Acme lets you send money across Africa in seconds.',
        'Fast transfers.',
        'Low fees.',
      ],
    });
    const faqPage = makePage({
      url: 'https://example.com/faq',
      markdown: [
        '# FAQ',
        '## What is Acme?',
        'A payments company.',
        '## How much does it cost?',
        'One percent.',
      ].join('\n'),
    });
    const result = analyzeContentClarity(makeCrawlResult([homepage, faqPage]));
    expect(result.score).toBe(15);
  });
});
