import type { CrawlResult } from '../crawler/types.js';
import type { CategoryScore } from '@repo/shared';
import type { ScoringResult } from './types.js';
import { analyzeEntityDefinition } from '../analyzers/entity-definition.js';
import { analyzeContentClarity } from '../analyzers/content-clarity.js';
import { analyzeTopicAuthority } from '../analyzers/topic-authority.js';
import { analyzeSemanticStructure } from '../analyzers/semantic-structure.js';
import { analyzeStructuredData } from '../analyzers/structured-data.js';
import { analyzeAiCrawlability } from '../analyzers/ai-crawlability.js';
import { analyzeBrandAuthority } from '../analyzers/brand-authority.js';
import { analyzeAiAnswerability } from '../analyzers/ai-answerability.js';
import type { OpenAiClient } from '../analyzers/ai-answerability.js';
import { generateRecommendations } from '../recommendations/engine.js';

const CATEGORY_LABELS: Record<string, string> = {
  'entity-definition': 'Entity Definition',
  'content-clarity': 'Content Clarity',
  'topic-authority': 'Topic Authority',
  'semantic-structure': 'Semantic Structure',
  'structured-data': 'Structured Data',
  'ai-crawlability': 'AI Crawlability',
  'brand-authority': 'Brand Authority',
  'ai-answerability': 'AI Answerability',
};

export async function runAudit(
  crawlResult: CrawlResult,
  openAiClient?: OpenAiClient
): Promise<ScoringResult> {
  const [
    entityDef,
    contentClarity,
    topicAuthority,
    semanticStructure,
    structuredData,
    aiCrawlability,
    brandAuthority,
    aiAnswerability,
  ] = await Promise.all([
    Promise.resolve(analyzeEntityDefinition(crawlResult)),
    Promise.resolve(analyzeContentClarity(crawlResult)),
    Promise.resolve(analyzeTopicAuthority(crawlResult)),
    Promise.resolve(analyzeSemanticStructure(crawlResult)),
    Promise.resolve(analyzeStructuredData(crawlResult)),
    Promise.resolve(analyzeAiCrawlability(crawlResult)),
    Promise.resolve(analyzeBrandAuthority(crawlResult)),
    analyzeAiAnswerability(crawlResult, openAiClient),
  ]);

  const analyzerResults = [
    entityDef,
    contentClarity,
    topicAuthority,
    semanticStructure,
    structuredData,
    aiCrawlability,
    brandAuthority,
    aiAnswerability,
  ];

  const categoryScores: CategoryScore[] = analyzerResults.map((r) => ({
    category: r.category,
    label: CATEGORY_LABELS[r.category] ?? r.category,
    score: r.score,
    maxScore: r.maxScore,
  }));

  const score = Math.min(
    100,
    categoryScores.reduce((sum, cs) => sum + cs.score, 0)
  );

  const findings = analyzerResults.flatMap((r) => r.findings);

  return {
    score,
    maxScore: 100,
    categoryScores,
    findings,
    recommendations: generateRecommendations(findings),
  };
}
