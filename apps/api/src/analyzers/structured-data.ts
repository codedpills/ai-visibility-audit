import type { CrawlResult } from '../crawler/types.js';
import type { AnalyzerResult } from './types.js';
import type { Finding } from '@repo/shared';

const MAX_SCORE = 10;

type SchemaType =
  | 'Organization'
  | 'Product'
  | 'Article'
  | 'BlogPosting'
  | 'FAQPage'
  | 'HowTo';

function hasSchema(
  pages: CrawlResult['pages'],
  ...types: SchemaType[]
): boolean {
  return pages.some((p) =>
    p.schemaOrg.some((s) => {
      const t = (s as Record<string, unknown>)['@type'];
      return typeof t === 'string' && types.includes(t as SchemaType);
    })
  );
}

function schemaFinding(
  pages: CrawlResult['pages'],
  signal: string,
  types: SchemaType[],
  label: string
): Finding {
  const present = hasSchema(pages, ...types);
  return {
    category: 'structured-data',
    signal,
    score: present ? 2 : 0,
    maxScore: 2,
    details: present
      ? `${label} schema found — improves AI entity recognition.`
      : `No ${label} schema detected. Adding it would improve AI entity recognition.`,
  };
}

export function analyzeStructuredData(
  crawlResult: CrawlResult
): AnalyzerResult {
  const { pages } = crawlResult;

  const findings: Finding[] = [
    schemaFinding(
      pages,
      'organization-schema',
      ['Organization'],
      'Organization'
    ),
    schemaFinding(pages, 'product-schema', ['Product'], 'Product'),
    schemaFinding(
      pages,
      'article-schema',
      ['Article', 'BlogPosting'],
      'Article/BlogPosting'
    ),
    schemaFinding(pages, 'faq-schema', ['FAQPage'], 'FAQPage'),
    schemaFinding(pages, 'howto-schema', ['HowTo'], 'HowTo'),
  ];

  const score = findings.reduce((sum, f) => sum + f.score, 0);

  return {
    category: 'structured-data',
    score,
    maxScore: MAX_SCORE,
    findings,
  };
}
