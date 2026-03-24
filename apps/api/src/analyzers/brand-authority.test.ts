import { describe, it, expect } from 'vitest';
import { analyzeBrandAuthority } from './brand-authority.js';
import { makePage, makeCrawlResult } from './test-helpers.js';

describe('analyzeBrandAuthority', () => {
  it('returns maxScore=15 and category=brand-authority', () => {
    const result = analyzeBrandAuthority(makeCrawlResult([]));
    expect(result.maxScore).toBe(15);
    expect(result.category).toBe('brand-authority');
  });

  it('scores 0 total on an empty crawl result', () => {
    const result = analyzeBrandAuthority(makeCrawlResult([]));
    expect(result.score).toBe(0);
  });

  it('scores 3 pts when site has a contact page', () => {
    const page = makePage({ url: 'https://example.com/contact' });
    const result = analyzeBrandAuthority(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'contact-page');
    expect(finding?.score).toBe(3);
  });

  it('scores 0 for contact-page when absent', () => {
    const page = makePage({ url: 'https://example.com' });
    const result = analyzeBrandAuthority(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'contact-page');
    expect(finding?.score).toBe(0);
  });

  it('scores 3 pts when site has a team or about page', () => {
    const page = makePage({ url: 'https://example.com/about' });
    const result = analyzeBrandAuthority(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'team-page');
    expect(finding?.score).toBe(3);
  });

  it('scores 0 for team-page when absent', () => {
    const page = makePage({ url: 'https://example.com/pricing' });
    const result = analyzeBrandAuthority(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'team-page');
    expect(finding?.score).toBe(0);
  });

  it('scores 3 pts when pages have external links to authoritative domains', () => {
    const page = makePage({
      url: 'https://example.com',
      externalLinks: [
        'https://techcrunch.com/article',
        'https://github.com/acme',
      ],
    });
    const result = analyzeBrandAuthority(makeCrawlResult([page]));
    const finding = result.findings.find(
      (f) => f.signal === 'external-authority-links'
    );
    expect(finding?.score).toBe(3);
  });

  it('scores 0 for external-authority-links when no external links', () => {
    const page = makePage({ url: 'https://example.com', externalLinks: [] });
    const result = analyzeBrandAuthority(makeCrawlResult([page]));
    const finding = result.findings.find(
      (f) => f.signal === 'external-authority-links'
    );
    expect(finding?.score).toBe(0);
  });

  it('scores 3 pts when pages contain social proof (testimonials/reviews)', () => {
    const page = makePage({
      url: 'https://example.com',
      markdown:
        '## What our customers say\n\n> 5 stars! Acme transformed our business.',
    });
    const result = analyzeBrandAuthority(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'social-proof');
    expect(finding?.score).toBe(3);
  });

  it('scores 0 for social-proof when absent', () => {
    const page = makePage({
      url: 'https://example.com',
      markdown: '# Acme\n\nWe build payments software.',
    });
    const result = analyzeBrandAuthority(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'social-proof');
    expect(finding?.score).toBe(0);
  });

  it('scores 3 pts when site links to social profiles', () => {
    const page = makePage({
      url: 'https://example.com',
      externalLinks: [
        'https://twitter.com/acme',
        'https://linkedin.com/company/acme',
      ],
    });
    const result = analyzeBrandAuthority(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'social-profiles');
    expect(finding?.score).toBe(3);
  });

  it('scores 0 for social-profiles when no social links', () => {
    const page = makePage({ url: 'https://example.com', externalLinks: [] });
    const result = analyzeBrandAuthority(makeCrawlResult([page]));
    const finding = result.findings.find((f) => f.signal === 'social-profiles');
    expect(finding?.score).toBe(0);
  });

  it('scores 15 total on a fully-featured site', () => {
    const pages = [
      makePage({
        url: 'https://example.com',
        externalLinks: [
          'https://twitter.com/acme',
          'https://techcrunch.com/acme',
        ],
        markdown:
          '## Testimonials\n\n> Acme saved us hours every week. — Happy Customer',
      }),
      makePage({ url: 'https://example.com/contact' }),
      makePage({ url: 'https://example.com/about-us' }),
    ];
    const result = analyzeBrandAuthority(makeCrawlResult(pages));
    expect(result.score).toBe(15);
  });
});
