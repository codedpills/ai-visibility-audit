import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getMyAudits, type AuditListItem } from '../api/client';
import { colors, fonts } from '../design/tokens';

function scoreColor(score: number | null) {
  if (score === null) return colors.textDim;
  if (score >= 70) return colors.success;
  if (score >= 40) return colors.warning;
  return colors.error;
}

function shortUrl(url: string) {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname !== '/' ? u.pathname : '');
  } catch {
    return url;
  }
}

export function MyAuditsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [audits, setAudits] = useState<AuditListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    getMyAudits()
      .then(setAudits)
      .catch(() => setError('Could not load your audits. Please try again.'))
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  return (
    <main style={s.root}>
      <div style={s.content}>
        <h1 style={s.heading}>My Audits</h1>

        {loading && <p style={s.muted}>Loading…</p>}
        {error && <p style={s.error}>{error}</p>}

        {!loading && !error && audits.length === 0 && (
          <div style={s.empty}>
            <p style={s.muted}>You haven't run any audits yet.</p>
            <Link to="/" style={s.ctaLink}>
              Run your first audit →
            </Link>
          </div>
        )}

        {!loading && audits.length > 0 && (
          <div style={s.list}>
            {audits.map((audit) => (
              <div key={audit.id} style={s.card}>
                <div style={s.cardLeft}>
                  <span
                    style={{
                      ...s.score,
                      color: scoreColor(audit.geoScore),
                    }}
                  >
                    {audit.geoScore !== null ? audit.geoScore : '—'}
                  </span>
                  <div>
                    <p style={s.url} title={audit.url}>
                      {shortUrl(audit.url)}
                    </p>
                    <p style={s.meta}>
                      {new Date(audit.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {audit.expiresAt && (
                        <span style={s.expiry}>
                          {' '}
                          · expires{' '}
                          {new Date(audit.expiresAt).toLocaleDateString(
                            'en-GB',
                            { day: 'numeric', month: 'short' }
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div style={s.cardRight}>
                  <span
                    style={{
                      ...s.statusBadge,
                      color:
                        audit.status === 'done'
                          ? colors.success
                          : colors.textDim,
                    }}
                  >
                    {audit.status}
                  </span>
                  {audit.status === 'done' && (
                    <Link to={`/audits/${audit.id}/results`} style={s.viewLink}>
                      View results →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

const s = {
  root: {
    background: colors.bg,
    color: colors.text,
    minHeight: '100vh',
    fontFamily: fonts.body,
    padding: '5rem 2rem 4rem',
  },
  content: {
    maxWidth: '720px',
    margin: '0 auto',
  },
  heading: {
    fontFamily: fonts.heading,
    fontSize: '1.75rem',
    fontWeight: 700,
    margin: '0 0 2rem',
    color: colors.text,
  },
  muted: {
    color: colors.textMuted,
    fontSize: '0.9rem',
  },
  error: {
    color: colors.error,
    fontSize: '0.9rem',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '3rem 0',
  },
  ctaLink: {
    display: 'inline-block',
    marginTop: '1rem',
    color: colors.secondary,
    fontWeight: 500,
    textDecoration: 'none',
    fontSize: '0.9rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    borderRadius: '10px',
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    gap: '1rem',
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    minWidth: 0,
  },
  score: {
    flexShrink: 0,
    fontFamily: fonts.heading,
    fontSize: '1.75rem',
    fontWeight: 800,
    width: '52px',
    textAlign: 'right' as const,
  },
  url: {
    fontSize: '0.9375rem',
    fontWeight: 500,
    color: colors.text,
    margin: '0 0 0.2rem',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
    maxWidth: '380px',
  },
  meta: {
    fontSize: '0.775rem',
    color: colors.textMuted,
    margin: 0,
  },
  expiry: {
    color: colors.textDim,
  },
  cardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexShrink: 0,
  },
  statusBadge: {
    fontSize: '0.75rem',
    textTransform: 'capitalize' as const,
    letterSpacing: '0.03em',
  },
  viewLink: {
    fontSize: '0.825rem',
    color: colors.secondary,
    textDecoration: 'none',
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
  },
} as const;
