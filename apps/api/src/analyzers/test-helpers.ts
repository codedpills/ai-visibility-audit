import type { CrawledPage, CrawlResult } from '../crawler/types.js';

export function makePage(overrides: Partial<CrawledPage> = {}): CrawledPage {
  return {
    url: 'https://example.com',
    html: '',
    markdown: '',
    text: '',
    title: '',
    h1s: [],
    h2s: [],
    paragraphs: [],
    internalLinks: [],
    externalLinks: [],
    schemaOrg: [],
    statusCode: 200,
    responseTimeMs: 100,
    ...overrides,
  };
}

export function makeCrawlResult(
  pages: CrawledPage[],
  overrides: Partial<Omit<CrawlResult, 'pages'>> = {}
): CrawlResult {
  return {
    domain: 'https://example.com',
    pages,
    robotsTxt: null,
    llmsTxt: null,
    ...overrides,
  };
}
