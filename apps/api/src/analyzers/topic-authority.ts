import type { CrawlResult } from '../crawler/types.js';
import type { AnalyzerResult } from './types.js';
import type { Finding } from '@repo/shared';

const MAX_SCORE = 15;

const BLOG_PATH_RE =
  /\/(blog|resources?|articles?|insights?|posts?|guides?|news|learn)\//i;
const BLOG_TITLE_RE =
  /^#{1,2}\s+(how\s+to|guide|tips?|best\s+practices?|intro|what\s+is)/im;

function scoreBlogContent(pages: CrawlResult['pages']): Finding {
  const present = pages.some(
    (p) => BLOG_PATH_RE.test(p.url) || BLOG_TITLE_RE.test(p.markdown)
  );
  return {
    category: 'topic-authority',
    signal: 'blog-content',
    score: present ? 5 : 0,
    maxScore: 5,
    details: present
      ? 'Site has a blog or resources section demonstrating topic depth.'
      : 'No blog or resources section detected.',
  };
}

function scorePageDepth(pages: CrawlResult['pages']): Finding {
  const count = pages.length;
  // 5+ pages earns full score; 3–4 partial; <3 zero
  const score = count >= 5 ? 5 : count >= 3 ? 3 : 0;
  return {
    category: 'topic-authority',
    signal: 'page-depth',
    score,
    maxScore: 5,
    details:
      count === 0
        ? 'No pages crawled.'
        : `${count} page(s) crawled — ${score === 5 ? 'strong' : score === 3 ? 'moderate' : 'limited'} content depth.`,
  };
}

function scoreInternalLinking(pages: CrawlResult['pages']): Finding {
  if (!pages.length) {
    return {
      category: 'topic-authority',
      signal: 'internal-linking',
      score: 0,
      maxScore: 5,
      details: 'No pages to assess internal linking.',
    };
  }
  const totalLinks = pages.reduce((sum, p) => sum + p.internalLinks.length, 0);
  const avg = totalLinks / pages.length;
  const score = avg >= 1 ? 5 : 0;
  return {
    category: 'topic-authority',
    signal: 'internal-linking',
    score,
    maxScore: 5,
    details:
      score > 0
        ? `Average of ${avg.toFixed(1)} internal links per page — good topic interconnection.`
        : 'Pages have no internal links, limiting topic authority signals.',
  };
}

export function analyzeTopicAuthority(
  crawlResult: CrawlResult
): AnalyzerResult {
  const { pages } = crawlResult;

  const findings: Finding[] = [
    scorePageDepth(pages),
    scoreBlogContent(pages),
    scoreInternalLinking(pages),
  ];

  const score = findings.reduce((sum, f) => sum + f.score, 0);

  return {
    category: 'topic-authority',
    score,
    maxScore: MAX_SCORE,
    findings,
  };
}
