import { describe, it, expect } from 'vitest';
import { analyzeEntityDefinition } from './entity-definition.js';
import { makePage, makeCrawlResult } from './test-helpers.js';

describe('analyzeEntityDefinition', () => {
  it('returns maxScore=15 and category=entity-definition', () => {
    const result = analyzeEntityDefinition(makeCrawlResult([]));
    expect(result.maxScore).toBe(15);
    expect(result.category).toBe('entity-definition');
  });

  it('scores 5 pts when homepage has a clear company definition statement', () => {
    const page = makePage({
      url: 'https://example.com',
      markdown:
        '# Acme\n\nAcme is a payments platform that helps African SMEs accept cross-border payments.',
      paragraphs: [
        'Acme is a payments platform that helps African SMEs accept cross-border payments.',
      ],
    });
    const result = analyzeEntityDefinition(makeCrawlResult([page]));
    const finding = result.findings.find(
      (f) => f.signal === 'company-definition'
    );
    expect(finding?.score).toBe(5);
  });

  it('scores 0 for company-definition when homepage has no definition pattern', () => {
    const page = makePage({
      url: 'https://example.com',
      markdown: '# Welcome\n\nClick around and explore.',
      paragraphs: ['Click around and explore.'],
    });
    const result = analyzeEntityDefinition(makeCrawlResult([page]));
    const finding = result.findings.find(
      (f) => f.signal === 'company-definition'
    );
    expect(finding?.score).toBe(0);
  });

  it('scores 3 pts when homepage contains problem + solution framing', () => {
    const page = makePage({
      url: 'https://example.com',
      markdown:
        '# Acme\n\nThe problem is that SMEs cannot accept payments. Acme solves this by providing a simple API.',
      paragraphs: [
        'The problem is that SMEs cannot accept payments.',
        'Acme solves this by providing a simple API.',
      ],
    });
    const result = analyzeEntityDefinition(makeCrawlResult([page]));
    const finding = result.findings.find(
      (f) => f.signal === 'problem-solution'
    );
    expect(finding?.score).toBe(3);
  });

  it('scores 3 pts when homepage clearly states a target customer', () => {
    const page = makePage({
      url: 'https://example.com',
      markdown: '# Acme\n\nBuilt for startups and small businesses.',
      paragraphs: ['Built for startups and small businesses.'],
    });
    const result = analyzeEntityDefinition(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'target-customer');
    expect(finding?.score).toBe(3);
  });

  it('scores 2 pts when homepage states geographic focus', () => {
    const page = makePage({
      url: 'https://example.com',
      markdown:
        '# Acme\n\nServing businesses across Africa and the Middle East.',
      paragraphs: ['Serving businesses across Africa and the Middle East.'],
    });
    const result = analyzeEntityDefinition(makeCrawlResult([page]));
    const finding = result.findings.find(
      (f) => f.signal === 'geographic-focus'
    );
    expect(finding?.score).toBe(2);
  });

  it('scores 2 pts for consistent brand language across 3+ pages', () => {
    const pages = [
      makePage({
        url: 'https://example.com',
        markdown: '# Acme\n\nAcme is great.',
      }),
      makePage({
        url: 'https://example.com/about',
        markdown: '## About Acme\n\nAcme was founded in 2020.',
      }),
      makePage({
        url: 'https://example.com/pricing',
        markdown: '## Acme Pricing\n\nAcme offers flexible plans.',
      }),
    ];
    const result = analyzeEntityDefinition(makeCrawlResult(pages));
    const finding = result.findings.find(
      (f) => f.signal === 'brand-consistency'
    );
    expect(finding?.score).toBe(2);
  });

  it('scores 15 total on a fully-featured homepage', () => {
    const homepage = makePage({
      url: 'https://example.com',
      markdown: [
        '# Acme',
        '',
        'Acme is a payments platform that helps African SMEs accept cross-border payments.',
        '',
        'The problem: SMEs struggle to get paid globally. Our solution is a one-line API.',
        '',
        'Built for small businesses and startups across Africa.',
        '',
        'Serving businesses in Nigeria, Kenya, and Ghana.',
      ].join('\n'),
      paragraphs: [
        'Acme is a payments platform that helps African SMEs accept cross-border payments.',
        'The problem: SMEs struggle to get paid globally. Our solution is a one-line API.',
        'Built for small businesses and startups across Africa.',
        'Serving businesses in Nigeria, Kenya, and Ghana.',
      ],
    });
    const pages = [
      homepage,
      makePage({
        url: 'https://example.com/about',
        markdown: '## About Acme\n\nAcme was founded in 2020.',
      }),
      makePage({
        url: 'https://example.com/pricing',
        markdown: '## Acme Pricing\n\nFlexible plans.',
      }),
    ];
    const result = analyzeEntityDefinition(makeCrawlResult(pages));
    expect(result.score).toBe(15);
  });

  it('scores 0 total on an empty crawl result', () => {
    const result = analyzeEntityDefinition(makeCrawlResult([]));
    expect(result.score).toBe(0);
  });
});
