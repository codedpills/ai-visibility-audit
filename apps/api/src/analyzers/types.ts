import type { AuditCategory, Finding } from '@repo/shared';
import type { CrawlResult } from '../crawler/types.js';

export interface AnalyzerResult {
  category: AuditCategory;
  score: number;
  maxScore: number;
  findings: Finding[];
}

export type Analyzer = (crawlResult: CrawlResult) => AnalyzerResult;
