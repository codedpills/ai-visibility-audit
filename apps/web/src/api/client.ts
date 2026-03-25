const _rawApiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
// Guard: if the value doesn't start with http(s)://, treat it as misconfigured
// and fall back to localhost so the error is obvious in dev, not a silent relative-path bug.
const API_BASE =
  _rawApiUrl.startsWith('http://') || _rawApiUrl.startsWith('https://')
    ? _rawApiUrl.replace(/\/$/, '') // strip trailing slash
    : 'http://localhost:3000';

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL?.startsWith('http')) {
  console.error(
    '[api/client] VITE_API_URL is not set or missing protocol — API calls will fail. Set VITE_API_URL=https://<your-api-domain> as a build-time env var in Railway.'
  );
}

export interface AuditResponse {
  id: string;
  url: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  geoScore: number | null;
  categoryScores: CategoryScoreResponse[] | null;
  findings: FindingResponse[] | null;
  recommendations: RecommendationResponse[] | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CategoryScoreResponse {
  category: string;
  label: string;
  score: number;
  maxScore: number;
}

export interface FindingResponse {
  category: string;
  signal: string;
  score: number;
  maxScore: number;
  details: string;
}

export interface RecommendationResponse {
  priority: 'critical' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  snippet?: string;
}

export async function submitAudit(url: string): Promise<{ auditId: string }> {
  const res = await fetch(`${API_BASE}/audits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? 'Failed to start audit'
    );
  }

  return res.json() as Promise<{ auditId: string }>;
}

export async function getAudit(auditId: string): Promise<AuditResponse> {
  const res = await fetch(`${API_BASE}/audits/${auditId}`);

  if (!res.ok) {
    throw new Error('Audit not found');
  }

  return res.json() as Promise<AuditResponse>;
}

export async function submitEmail(
  auditId: string,
  email: string
): Promise<{ recommendations: RecommendationResponse[] }> {
  const res = await fetch(`${API_BASE}/audits/${auditId}/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? 'Failed to submit email'
    );
  }

  return res.json() as Promise<{ recommendations: RecommendationResponse[] }>;
}
