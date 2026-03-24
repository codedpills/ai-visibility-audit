import type { CrawlResult } from '../crawler/types.js';
import type { AnalyzerResult } from './types.js';
import type { Finding } from '@repo/shared';

const MAX_SCORE = 10;

function scoreSingleH1(pages: CrawlResult['pages']): Finding {
  if (!pages.length) {
    return {
      category: 'semantic-structure',
      signal: 'single-h1',
      score: 0,
      maxScore: 4,
      details: 'No pages crawled.',
    };
  }
  const goodPages = pages.filter((p) => p.h1s.length === 1);
  const ratio = goodPages.length / pages.length;
  const score = ratio >= 0.8 ? 4 : 0;
  return {
    category: 'semantic-structure',
    signal: 'single-h1',
    score,
    maxScore: 4,
    details:
      score > 0
        ? `${goodPages.length} of ${pages.length} pages have exactly one H1.`
        : `Only ${goodPages.length} of ${pages.length} pages have exactly one H1 (expect ≥80%).`,
  };
}

function scoreH2Questions(pages: CrawlResult['pages']): Finding {
  const allH2s = pages.flatMap((p) => p.h2s);
  if (!allH2s.length) {
    return {
      category: 'semantic-structure',
      signal: 'h2-as-questions',
      score: 0,
      maxScore: 3,
      details: 'No H2 headings found.',
    };
  }
  const questionH2s = allH2s.filter((h) => h.trim().endsWith('?'));
  const ratio = questionH2s.length / allH2s.length;
  const score = ratio >= 0.3 ? 3 : 0;
  return {
    category: 'semantic-structure',
    signal: 'h2-as-questions',
    score,
    maxScore: 3,
    details:
      score > 0
        ? `${questionH2s.length} of ${allH2s.length} H2s are phrased as questions — great for AI Q&A matching.`
        : `Only ${questionH2s.length} of ${allH2s.length} H2s are questions. Consider reframing headings as questions.`,
  };
}

function scoreParagraphLength(pages: CrawlResult['pages']): Finding {
  const allParagraphs = pages.flatMap((p) => p.paragraphs);
  if (!allParagraphs.length) {
    return {
      category: 'semantic-structure',
      signal: 'paragraph-length',
      score: 0,
      maxScore: 3,
      details: 'No paragraphs found.',
    };
  }
  const avg =
    allParagraphs.reduce(
      (sum, p) => sum + p.split(/\s+/).filter(Boolean).length,
      0
    ) / allParagraphs.length;
  const score = avg <= 80 ? 3 : 0;
  return {
    category: 'semantic-structure',
    signal: 'paragraph-length',
    score,
    maxScore: 3,
    details:
      score > 0
        ? `Average paragraph length is ${Math.round(avg)} words — well within AI-readable range.`
        : `Average paragraph length is ${Math.round(avg)} words — shorter paragraphs improve AI comprehension.`,
  };
}

export function analyzeSemanticStructure(
  crawlResult: CrawlResult
): AnalyzerResult {
  const { pages } = crawlResult;

  const findings: Finding[] = [
    scoreSingleH1(pages),
    scoreH2Questions(pages),
    scoreParagraphLength(pages),
  ];

  const score = findings.reduce((sum, f) => sum + f.score, 0);

  return {
    category: 'semantic-structure',
    score,
    maxScore: MAX_SCORE,
    findings,
  };
}
