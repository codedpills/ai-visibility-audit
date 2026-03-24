import { FirecrawlAppV1 } from '@mendable/firecrawl-js';
import { got } from 'got';
import type { CrawledPage, CrawlResult } from './types.js';

const MAX_PAGES = 10;
const PLAIN_FETCH_TIMEOUT_MS = 10_000;

function extractDomain(url: string): string {
  return new URL(url).origin;
}

function extractSchemaOrg(html: string): Record<string, unknown>[] {
  const schemas: Record<string, unknown>[] = [];
  const regex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]) as unknown;
      if (Array.isArray(parsed)) {
        schemas.push(...(parsed as Record<string, unknown>[]));
      } else {
        schemas.push(parsed as Record<string, unknown>);
      }
    } catch {
      // malformed JSON-LD — skip
    }
  }
  return schemas;
}

// Level 1: lines starting with exactly one '#' followed by a space
function extractH1s(markdown: string): string[] {
  return markdown
    .split('\n')
    .filter((line) => /^# /.test(line))
    .map((line) => line.replace(/^# /, '').trim())
    .filter(Boolean);
}

// Level 2: lines starting with '## '
function extractH2s(markdown: string): string[] {
  return markdown
    .split('\n')
    .filter((line) => /^## /.test(line))
    .map((line) => line.replace(/^## /, '').trim())
    .filter(Boolean);
}

// Prose paragraphs: non-heading, non-empty blocks of meaningful length
function extractParagraphs(markdown: string): string[] {
  return markdown
    .split(/\n{2,}/)
    .map((block) => block.replace(/\n/g, ' ').trim())
    .filter((block) => block.length > 20 && !/^#{1,6} /.test(block));
}

function classifyLinks(
  links: string[],
  origin: string
): { internal: string[]; external: string[] } {
  const internal: string[] = [];
  const external: string[] = [];
  for (const link of links) {
    try {
      const abs = new URL(link);
      if (abs.origin === origin) {
        internal.push(link);
      } else {
        external.push(link);
      }
    } catch {
      // skip invalid URLs
    }
  }
  return { internal, external };
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await got(url, {
      timeout: { request: PLAIN_FETCH_TIMEOUT_MS },
      headers: { 'User-Agent': 'LLMRankBot/1.0' },
      throwHttpErrors: false,
    });
    return response.statusCode < 400 ? response.body : null;
  } catch {
    return null;
  }
}

export async function crawl(rootUrl: string): Promise<CrawlResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY environment variable is required');
  }

  const parsed = new URL(rootUrl);
  const domain = parsed.origin;

  // Fetch robots.txt and llms.txt directly — plain text, no JS needed
  const [robotsTxt, llmsTxt] = await Promise.all([
    fetchText(`${domain}/robots.txt`),
    fetchText(`${domain}/llms.txt`),
  ]);

  const app = new FirecrawlAppV1({ apiKey });

  const crawlResult = await app.crawlUrl(rootUrl, {
    limit: MAX_PAGES,
    scrapeOptions: {
      formats: ['markdown', 'html', 'links'],
      onlyMainContent: false,
    },
  });

  if (!crawlResult.success || !('data' in crawlResult)) {
    throw new Error(
      `Firecrawl crawl failed: ${'error' in crawlResult ? (crawlResult as { error?: string }).error : 'unknown error'}`
    );
  }

  type FirecrawlDoc = NonNullable<(typeof crawlResult)['data']>[number];

  const pages: CrawledPage[] = (crawlResult.data ?? []).map(
    (doc: FirecrawlDoc) => {
      const url = doc.metadata?.sourceURL ?? doc.url ?? rootUrl;
      const html = doc.html ?? doc.rawHtml ?? '';
      const markdown = doc.markdown ?? '';
      const origin = extractDomain(url);
      const { internal, external } = classifyLinks(doc.links ?? [], origin);

      return {
        url,
        html,
        markdown,
        text: markdown,
        title: doc.metadata?.title ?? '',
        h1s: extractH1s(markdown),
        h2s: extractH2s(markdown),
        paragraphs: extractParagraphs(markdown),
        internalLinks: [...new Set(internal)],
        externalLinks: [...new Set(external)],
        schemaOrg: extractSchemaOrg(html),
        statusCode: doc.metadata?.statusCode ?? 200,
        responseTimeMs: 0,
      };
    }
  );

  return {
    domain,
    pages,
    robotsTxt: robotsTxt ?? null,
    llmsTxt: llmsTxt ?? null,
  };
}
