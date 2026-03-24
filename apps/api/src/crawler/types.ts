export interface CrawledPage {
  url: string;
  html: string;
  markdown: string;
  text: string;
  title: string;
  h1s: string[];
  h2s: string[];
  paragraphs: string[];
  internalLinks: string[];
  externalLinks: string[];
  schemaOrg: Record<string, unknown>[];
  statusCode: number;
  responseTimeMs: number;
}

export interface CrawlResult {
  domain: string;
  pages: CrawledPage[];
  robotsTxt: string | null;
  llmsTxt: string | null;
}
