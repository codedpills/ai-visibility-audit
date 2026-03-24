import type { Generated, ColumnType } from 'kysely';
import type { CategoryScore, Finding, Recommendation } from '@repo/shared';

export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  plan: 'free' | 'pro';
  created_at: Generated<Date>;
}

export interface AuditsTable {
  id: Generated<string>;
  url: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  tier: 'free' | 'pro';
  geo_score: number | null;
  category_scores: ColumnType<
    CategoryScore[] | null,
    string | null,
    string | null
  >;
  findings: ColumnType<Finding[] | null, string | null, string | null>;
  recommendations: ColumnType<
    Recommendation[] | null,
    string | null,
    string | null
  >;
  expires_at: Date | null;
  user_id: string | null;
  created_at: Generated<Date>;
}

export interface AuditEmailsTable {
  id: Generated<string>;
  audit_id: string;
  email: string;
  created_at: Generated<Date>;
}

export interface Database {
  users: UsersTable;
  audits: AuditsTable;
  audit_emails: AuditEmailsTable;
}
