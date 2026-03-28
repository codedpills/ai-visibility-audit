declare global {
  interface Window {
    __ENV__?: { API_URL?: string };
  }
}

// Runtime config (injected via /env-config.js at container start) takes precedence
// over the build-time VITE_API_URL so Railway env var changes never require a rebuild.
// Guard against SSR (Node.js) environment where window is not defined.
const _rawApiUrl =
  (typeof window !== 'undefined' ? window.__ENV__?.API_URL : undefined) ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';
// Guard: if the value doesn't start with http(s)://, treat it as misconfigured
// and fall back to localhost so the error is obvious in dev, not a silent relative-path bug.
const API_BASE =
  _rawApiUrl.startsWith('http://') || _rawApiUrl.startsWith('https://')
    ? _rawApiUrl.replace(/\/$/, '') // strip trailing slash
    : 'http://localhost:3000';

if (
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  !_rawApiUrl.startsWith('http')
) {
  console.error(
    '[api/client] API_URL is not set or missing protocol — API calls will fail. Set API_URL in Railway web service Variables.'
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

// ─── Auth types ───────────────────────────────────────────────────────────────

export interface MeResponse {
  id: string;
  email: string;
  auditsThisMonth: number;
  monthlyLimit: number;
  monthResetAt: string;
  donated: boolean;
  donationPoints: number;
}

// ─── Anonymous ID ─────────────────────────────────────────────────────────────

/** Returns a stable UUID stored in localStorage, used for anon rate-limit keys. */
export function getAnonId(): string {
  const KEY = 'anon_id';
  let id =
    typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
  if (!id) {
    id = crypto.randomUUID();
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, id);
  }
  return id;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export async function sendMagicLink(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/magic-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? 'Failed to send magic link'
    );
  }
}

export async function verifyMagicLink(token: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/auth/verify?token=${encodeURIComponent(token)}`,
    { credentials: 'include' }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? 'Invalid or expired link'
    );
  }
}

export async function getMe(): Promise<MeResponse | null> {
  const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json() as Promise<MeResponse>;
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

// ─── Audits ───────────────────────────────────────────────────────────────────

export async function submitAudit(url: string): Promise<{ auditId: string }> {
  const res = await fetch(`${API_BASE}/audits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Anon-ID': getAnonId(),
    },
    credentials: 'include',
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
