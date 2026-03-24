import type { CrawlResult } from '../crawler/types.js';
import type { AnalyzerResult } from './types.js';
import type { Finding } from '@repo/shared';

const MAX_SCORE = 15;

const DEFINITION_PATTERNS = [
  /\bis\s+a\b/i,
  /\bwe\s+(are|help|build|provide|offer|enable|power|make)\b/i,
  /\bour\s+(platform|product|tool|service|solution|api)\b/i,
  /\bhelps?\s+\w+\s+(to\s+)?\w+/i,
];

const PROBLEM_SOLUTION_PATTERNS = [
  /\bproblem\b/i,
  /\bsolve[sd]?\b/i,
  /\bsolution\b/i,
  /\bchallenge\b/i,
  /\bstruggle[sd]?\b/i,
  /\bpain\s+point\b/i,
];

const TARGET_CUSTOMER_PATTERNS = [
  /\bbuilt\s+for\b/i,
  /\bdesigned\s+for\b/i,
  /\bfor\s+(startups?|businesses?|teams?|developers?|founders?|companies|enterprises?|smbs?|smes?)\b/i,
  /\btailored\s+(for|to)\b/i,
  /\bideal\s+for\b/i,
];

// Regions, countries, continents, or explicit global/worldwide mentions
const GEO_PATTERNS = [
  /\b(africa|asia|europe|americas?|middle\s+east|latin\s+america)\b/i,
  /\b(nigeria|kenya|ghana|south\s+africa|egypt|uk|usa|us|india|brazil)\b/i,
  /\b(global(ly)?|worldwide|international(ly)?|cross-border)\b/i,
];

function getHomepage(pages: CrawlResult['pages']) {
  return (
    pages.find((p) => {
      try {
        return new URL(p.url).pathname === '/';
      } catch {
        return false;
      }
    }) ?? pages[0]
  );
}

function homepageText(crawlResult: CrawlResult): string {
  const hp = getHomepage(crawlResult.pages);
  if (!hp) return '';
  return [hp.markdown, ...hp.paragraphs].join(' ');
}

function scoreCompanyDefinition(crawlResult: CrawlResult): Finding {
  const text = homepageText(crawlResult);
  const matched = DEFINITION_PATTERNS.some((re) => re.test(text));
  return {
    category: 'entity-definition',
    signal: 'company-definition',
    score: matched ? 5 : 0,
    maxScore: 5,
    details: matched
      ? 'Homepage contains a clear company or product definition statement.'
      : 'No clear company or product definition statement found on the homepage.',
  };
}

function scoreProblemSolution(crawlResult: CrawlResult): Finding {
  const text = homepageText(crawlResult);
  const matched = PROBLEM_SOLUTION_PATTERNS.some((re) => re.test(text));
  return {
    category: 'entity-definition',
    signal: 'problem-solution',
    score: matched ? 3 : 0,
    maxScore: 3,
    details: matched
      ? 'Homepage explicitly frames a problem and solution.'
      : 'No problem/solution framing detected on the homepage.',
  };
}

function scoreTargetCustomer(crawlResult: CrawlResult): Finding {
  const text = homepageText(crawlResult);
  const matched = TARGET_CUSTOMER_PATTERNS.some((re) => re.test(text));
  return {
    category: 'entity-definition',
    signal: 'target-customer',
    score: matched ? 3 : 0,
    maxScore: 3,
    details: matched
      ? 'Homepage clearly identifies a target customer.'
      : 'No target customer language detected on the homepage.',
  };
}

function scoreGeographicFocus(crawlResult: CrawlResult): Finding {
  const text = homepageText(crawlResult);
  const matched = GEO_PATTERNS.some((re) => re.test(text));
  return {
    category: 'entity-definition',
    signal: 'geographic-focus',
    score: matched ? 2 : 0,
    maxScore: 2,
    details: matched
      ? 'Geographic focus or global scope is stated.'
      : 'No geographic focus detected (acceptable for some products).',
  };
}

function scoreBrandConsistency(crawlResult: CrawlResult): Finding {
  const { pages } = crawlResult;
  if (pages.length < 2) {
    return {
      category: 'entity-definition',
      signal: 'brand-consistency',
      score: 0,
      maxScore: 2,
      details: 'Not enough pages crawled to assess brand consistency.',
    };
  }

  // Extract candidate brand name: first H1 (from h1s array, or parsed from markdown)
  const hp = getHomepage(pages);
  const h1FromMarkdown = hp?.markdown
    .match(/^#\s+(.+)$/m)?.[1]
    ?.split(/\s+/)[0];
  const brandCandidate = (
    hp?.h1s[0]?.split(/\s+/)[0] ??
    h1FromMarkdown ??
    ''
  ).toLowerCase();

  if (!brandCandidate || brandCandidate.length < 2) {
    return {
      category: 'entity-definition',
      signal: 'brand-consistency',
      score: 0,
      maxScore: 2,
      details: 'Could not identify a brand name to check consistency.',
    };
  }

  const mentionedOn = pages.filter((p) =>
    p.markdown.toLowerCase().includes(brandCandidate)
  ).length;

  const consistent = mentionedOn >= Math.min(3, pages.length);
  return {
    category: 'entity-definition',
    signal: 'brand-consistency',
    score: consistent ? 2 : 0,
    maxScore: 2,
    details: consistent
      ? `Brand name "${brandCandidate}" appears consistently across ${mentionedOn} pages.`
      : `Brand name "${brandCandidate}" only found on ${mentionedOn} of ${pages.length} pages.`,
  };
}

export function analyzeEntityDefinition(
  crawlResult: CrawlResult
): AnalyzerResult {
  const findings: Finding[] = [
    scoreCompanyDefinition(crawlResult),
    scoreProblemSolution(crawlResult),
    scoreTargetCustomer(crawlResult),
    scoreGeographicFocus(crawlResult),
    scoreBrandConsistency(crawlResult),
  ];

  const score = findings.reduce((sum, f) => sum + f.score, 0);

  return {
    category: 'entity-definition',
    score,
    maxScore: MAX_SCORE,
    findings,
  };
}
