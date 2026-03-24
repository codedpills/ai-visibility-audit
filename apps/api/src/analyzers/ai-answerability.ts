import OpenAI from 'openai';
import type { CrawlResult } from '../crawler/types.js';
import type { AnalyzerResult } from './types.js';
import type { Finding } from '@repo/shared';

export type OpenAiClient = Pick<OpenAI, 'chat'>;

const MAX_SCORE = 10;

const PROMPT_TEMPLATE = `You are assessing how well the following website content enables an AI model to accurately answer questions about the company.

Rate the content on a scale of 0-10 where:
- 0 = The content provides no usable information for answering questions
- 5 = The content answers basic questions but lacks depth
- 10 = The content comprehensively answers who, what, why, how, and for whom

Respond with ONLY a single integer from 0 to 10.

Website content:
---
{content}
---`;

function buildContent(crawlResult: CrawlResult): string {
  const { pages } = crawlResult;
  if (!pages.length) return '';

  // Use homepage markdown + up to 2 more pages, truncated to ~3000 chars
  const ordered = [
    ...pages.filter((p) => {
      try {
        return new URL(p.url).pathname === '/';
      } catch {
        return false;
      }
    }),
    ...pages.filter((p) => {
      try {
        return new URL(p.url).pathname !== '/';
      } catch {
        return true;
      }
    }),
  ].slice(0, 3);

  return ordered
    .map((p) => `[${p.url}]\n${p.markdown}`)
    .join('\n\n---\n\n')
    .slice(0, 3000);
}

export async function analyzeAiAnswerability(
  crawlResult: CrawlResult,
  client?: OpenAiClient
): Promise<AnalyzerResult> {
  const content = buildContent(crawlResult);

  const defectFinding: Finding = {
    category: 'ai-answerability',
    signal: 'ai-answer-quality',
    score: 0,
    maxScore: MAX_SCORE,
    details: '',
  };

  if (!content) {
    return {
      category: 'ai-answerability',
      score: 0,
      maxScore: MAX_SCORE,
      findings: [
        { ...defectFinding, details: 'No content available to assess.' },
      ],
    };
  }

  try {
    const openai =
      client ?? new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: PROMPT_TEMPLATE.replace('{content}', content),
        },
      ],
      max_tokens: 5,
      temperature: 0,
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? '0';
    const parsed = parseInt(raw, 10);
    const score = Number.isNaN(parsed)
      ? 0
      : Math.max(0, Math.min(MAX_SCORE, parsed));

    const finding: Finding = {
      category: 'ai-answerability',
      signal: 'ai-answer-quality',
      score,
      maxScore: MAX_SCORE,
      details:
        score >= 8
          ? 'Content is highly informative and enables accurate AI responses.'
          : score >= 5
            ? 'Content answers basic questions but could be more detailed.'
            : 'Content lacks depth — AI models may struggle to accurately describe your company.',
    };

    return {
      category: 'ai-answerability',
      score,
      maxScore: MAX_SCORE,
      findings: [finding],
    };
  } catch {
    return {
      category: 'ai-answerability',
      score: 0,
      maxScore: MAX_SCORE,
      findings: [
        {
          ...defectFinding,
          details:
            'AI answerability check could not be completed (API unavailable).',
        },
      ],
    };
  }
}
