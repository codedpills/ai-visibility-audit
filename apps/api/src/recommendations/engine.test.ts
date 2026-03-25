import { describe, it, expect } from 'vitest';
import { generateRecommendations } from './engine.js';
import type { Finding } from '@repo/shared';

const finding = (
  overrides: Partial<Finding> & Pick<Finding, 'score' | 'maxScore'>
): Finding => ({
  category: 'structured-data',
  signal: 'JSON-LD present',
  details: 'No structured data found',
  ...overrides,
});

describe('generateRecommendations', () => {
  it('returns empty array for empty findings', () => {
    expect(generateRecommendations([])).toEqual([]);
  });

  it('skips findings already at max score', () => {
    const findings = [finding({ score: 5, maxScore: 5 })];
    expect(generateRecommendations(findings)).toEqual([]);
  });

  it('assigns critical priority when score is 0', () => {
    const findings = [finding({ score: 0, maxScore: 5 })];
    const recs = generateRecommendations(findings);
    expect(recs).toHaveLength(1);
    expect(recs[0].priority).toBe('critical');
  });

  it('assigns medium priority when score < 60% of maxScore', () => {
    const findings = [finding({ score: 1, maxScore: 5 })]; // 20%
    const recs = generateRecommendations(findings);
    expect(recs[0].priority).toBe('medium');
  });

  it('assigns low priority when score >= 60% but below max', () => {
    const findings = [finding({ score: 3, maxScore: 5 })]; // 60%
    const recs = generateRecommendations(findings);
    expect(recs[0].priority).toBe('low');
  });

  it('sorts recommendations critical → medium → low', () => {
    const findings = [
      finding({ score: 3, maxScore: 5, signal: 'low signal' }), // low
      finding({ score: 0, maxScore: 5, signal: 'critical signal' }), // critical
      finding({ score: 1, maxScore: 5, signal: 'medium signal' }), // medium
    ];
    const recs = generateRecommendations(findings);
    expect(recs.map((r) => r.priority)).toEqual(['critical', 'medium', 'low']);
  });

  it('includes a code snippet for structured-data finding at score 0', () => {
    const findings = [
      finding({ category: 'structured-data', score: 0, maxScore: 10 }),
    ];
    const recs = generateRecommendations(findings);
    expect(recs[0].snippet).toBeTruthy();
    expect(recs[0].snippet).toContain('@context');
  });

  it('includes a snippet for ai-crawlability finding at score 0', () => {
    const findings = [
      finding({ category: 'ai-crawlability', score: 0, maxScore: 10 }),
    ];
    const recs = generateRecommendations(findings);
    expect(recs[0].snippet).toContain('User-agent');
  });

  it('populates title, description and category on each recommendation', () => {
    const findings = [
      finding({ category: 'entity-definition', score: 0, maxScore: 15 }),
    ];
    const [rec] = generateRecommendations(findings);
    expect(rec.title).toBeTruthy();
    expect(rec.description).toBeTruthy();
    expect(rec.category).toBe('entity-definition');
  });
});
