import type { CategoryScore, Finding, Recommendation } from '@repo/shared';

export interface ScoringResult {
  score: number;
  maxScore: number;
  categoryScores: CategoryScore[];
  findings: Finding[];
  recommendations: Recommendation[];
}
