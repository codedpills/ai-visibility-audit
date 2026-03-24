export type AuditStatus = 'pending' | 'running' | 'done' | 'failed';

export type AuditTier = 'free' | 'pro';

export type RecommendationPriority = 'critical' | 'medium' | 'low';

export type AuditCategory =
  | 'entity-definition'
  | 'content-clarity'
  | 'topic-authority'
  | 'semantic-structure'
  | 'structured-data'
  | 'ai-crawlability'
  | 'brand-authority'
  | 'ai-answerability';

export interface CategoryScore {
  category: AuditCategory;
  label: string;
  score: number;
  maxScore: number;
}

export interface Finding {
  category: AuditCategory;
  signal: string;
  score: number;
  maxScore: number;
  details: string;
}

export interface Recommendation {
  priority: RecommendationPriority;
  category: AuditCategory;
  title: string;
  description: string;
  snippet?: string;
}

export interface AuditResult {
  id: string;
  url: string;
  status: AuditStatus;
  tier: AuditTier;
  geoScore: number | null;
  categoryScores: CategoryScore[] | null;
  findings: Finding[] | null;
  recommendations: Recommendation[] | null;
  expiresAt: string | null;
  userId: string | null;
  createdAt: string;
}
