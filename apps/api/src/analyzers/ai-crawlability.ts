import type { CrawlResult } from '../crawler/types.js';
import type { AnalyzerResult } from './types.js';
import type { Finding } from '@repo/shared';
import { parseRobotsTxt } from '../crawler/robots.js';

const MAX_SCORE = 10;

function scoreRobotsAiAccess(
  robotsTxt: string | null,
  domain: string
): Finding {
  if (!robotsTxt) {
    return {
      category: 'ai-crawlability',
      signal: 'robots-ai-access',
      score: 0,
      maxScore: 5,
      details:
        'No robots.txt found. Add one to explicitly grant AI crawlers access.',
    };
  }

  const { blockedBots } = parseRobotsTxt(robotsTxt, domain);

  if (blockedBots.length > 0) {
    return {
      category: 'ai-crawlability',
      signal: 'robots-ai-access',
      score: 0,
      maxScore: 5,
      details: `robots.txt blocks these AI crawlers: ${blockedBots.join(', ')}.`,
    };
  }

  return {
    category: 'ai-crawlability',
    signal: 'robots-ai-access',
    score: 5,
    maxScore: 5,
    details: 'robots.txt does not block any known AI crawlers.',
  };
}

function scoreLlmsTxt(llmsTxt: string | null): Finding {
  const present = typeof llmsTxt === 'string' && llmsTxt.trim().length > 0;
  return {
    category: 'ai-crawlability',
    signal: 'llms-txt',
    score: present ? 5 : 0,
    maxScore: 5,
    details: present
      ? 'llms.txt file found — excellent for direct AI ingestion.'
      : 'No llms.txt file found. Adding one gives AI models a curated summary of your site.',
  };
}

export function analyzeAiCrawlability(
  crawlResult: CrawlResult
): AnalyzerResult {
  const { robotsTxt, llmsTxt, domain } = crawlResult;

  const findings: Finding[] = [
    scoreRobotsAiAccess(robotsTxt, domain),
    scoreLlmsTxt(llmsTxt),
  ];

  const score = findings.reduce((sum, f) => sum + f.score, 0);

  return {
    category: 'ai-crawlability',
    score,
    maxScore: MAX_SCORE,
    findings,
  };
}
