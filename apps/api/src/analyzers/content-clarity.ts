import type { CrawlResult } from '../crawler/types.js';
import type { AnalyzerResult } from './types.js';
import type { Finding } from '@repo/shared';

const MAX_SCORE = 15;

const FAQ_HEADING_RE = /^#{1,3}\s+(faq|frequently asked|common questions?)/im;
const FAQ_QUESTION_RE = /^#{2,4}\s+.+\?/m;
// Plain-language markers: short, punchy sentences using common words
const PLAIN_LANGUAGE_RE =
  /\b(simple|easy|fast|instant|quick|free|in seconds|one.?click|no code)\b/i;

function hasBulletLists(markdown: string): boolean {
  return /^[-*+]\s+\S|^\d+\.\s+\S/m.test(markdown);
}

function hasFaqSection(pages: CrawlResult['pages']): boolean {
  return pages.some(
    (p) => FAQ_HEADING_RE.test(p.markdown) || FAQ_QUESTION_RE.test(p.markdown)
  );
}

function hasPlainLanguageSummary(
  markdown: string,
  paragraphs: string[]
): boolean {
  const text = [markdown, ...paragraphs].join(' ');
  return PLAIN_LANGUAGE_RE.test(text);
}

function averageWordCount(paragraphs: string[]): number {
  if (!paragraphs.length) return Infinity;
  const total = paragraphs.reduce(
    (sum, p) => sum + p.split(/\s+/).filter(Boolean).length,
    0
  );
  return total / paragraphs.length;
}

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

function getAllMarkdown(pages: CrawlResult['pages']): string {
  return pages.map((p) => p.markdown).join('\n');
}

export function analyzeContentClarity(
  crawlResult: CrawlResult
): AnalyzerResult {
  const { pages } = crawlResult;
  const hp = getHomepage(pages);
  const allMarkdown = getAllMarkdown(pages);
  const allParagraphs = pages.flatMap((p) => p.paragraphs);

  const bulletScore: Finding = (() => {
    const present = hasBulletLists(allMarkdown);
    return {
      category: 'content-clarity',
      signal: 'bullet-lists',
      score: present ? 4 : 0,
      maxScore: 4,
      details: present
        ? 'Site uses bullet or numbered lists to present information clearly.'
        : 'No bullet or numbered lists found across crawled pages.',
    };
  })();

  const faqScore: Finding = (() => {
    const present = hasFaqSection(pages);
    return {
      category: 'content-clarity',
      signal: 'faq-section',
      score: present ? 4 : 0,
      maxScore: 4,
      details: present
        ? 'Site has a FAQ section, improving direct-answer visibility.'
        : 'No FAQ section detected.',
    };
  })();

  const plainLangScore: Finding = (() => {
    const hpMarkdown = hp?.markdown ?? '';
    const hpParagraphs = hp?.paragraphs ?? [];
    const present = hasPlainLanguageSummary(hpMarkdown, hpParagraphs);
    return {
      category: 'content-clarity',
      signal: 'plain-language-summary',
      score: present ? 4 : 0,
      maxScore: 4,
      details: present
        ? 'Homepage contains a plain-language summary of the product.'
        : 'No plain-language summary detected on the homepage.',
    };
  })();

  const readabilityScore: Finding = (() => {
    const avgWords = averageWordCount(allParagraphs);
    // ≤60 avg words/paragraph earns full readability score
    const score = avgWords <= 60 && allParagraphs.length > 0 ? 3 : 0;
    return {
      category: 'content-clarity',
      signal: 'readability',
      score,
      maxScore: 3,
      details:
        allParagraphs.length === 0
          ? 'No paragraphs found to assess readability.'
          : score > 0
            ? `Average paragraph length is ${Math.round(avgWords)} words — concise and readable.`
            : `Average paragraph length is ${Math.round(avgWords)} words — may be too long for AI processing.`,
    };
  })();

  const findings: Finding[] = [
    bulletScore,
    faqScore,
    plainLangScore,
    readabilityScore,
  ];
  const score = findings.reduce((sum, f) => sum + f.score, 0);

  return {
    category: 'content-clarity',
    score,
    maxScore: MAX_SCORE,
    findings,
  };
}
