import { describe, it, expect, vi } from 'vitest';
import { analyzeAiAnswerability } from './ai-answerability.js';
import type { OpenAiClient } from './ai-answerability.js';
import { makePage, makeCrawlResult } from './test-helpers.js';

function makeClient(content: string): OpenAiClient {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content } }],
        }),
      },
    },
  } as unknown as OpenAiClient;
}

function makeFailingClient(): OpenAiClient {
  return {
    chat: {
      completions: {
        create: vi.fn().mockRejectedValue(new Error('API error')),
      },
    },
  } as unknown as OpenAiClient;
}

describe('analyzeAiAnswerability', () => {
  it('returns maxScore=10 and category=ai-answerability', async () => {
    const result = await analyzeAiAnswerability(
      makeCrawlResult([]),
      makeClient('0')
    );
    expect(result.maxScore).toBe(10);
    expect(result.category).toBe('ai-answerability');
  });

  it('scores 10 when answer quality is high (model returns 10)', async () => {
    const page = makePage({
      url: 'https://example.com',
      markdown: '# Acme\n\nAcme is a payments platform for African SMEs.',
    });
    const result = await analyzeAiAnswerability(
      makeCrawlResult([page]),
      makeClient('10')
    );
    const finding = result.findings.find(
      (f) => f.signal === 'ai-answer-quality'
    );
    expect(finding?.score).toBe(10);
    expect(result.score).toBe(10);
  });

  it('scores 5 when model returns a mid-range score', async () => {
    const result = await analyzeAiAnswerability(
      makeCrawlResult([makePage()]),
      makeClient('5')
    );
    const finding = result.findings.find(
      (f) => f.signal === 'ai-answer-quality'
    );
    expect(finding?.score).toBe(5);
  });

  it('scores 0 when model returns 0', async () => {
    const result = await analyzeAiAnswerability(
      makeCrawlResult([makePage()]),
      makeClient('0')
    );
    expect(result.score).toBe(0);
  });

  it('scores 0 gracefully when OpenAI call fails', async () => {
    const result = await analyzeAiAnswerability(
      makeCrawlResult([makePage()]),
      makeFailingClient()
    );
    expect(result.score).toBe(0);
    const finding = result.findings.find(
      (f) => f.signal === 'ai-answer-quality'
    );
    expect(finding?.score).toBe(0);
  });

  it('scores 0 when no pages are crawled', async () => {
    const result = await analyzeAiAnswerability(makeCrawlResult([]));
    expect(result.score).toBe(0);
  });
});
