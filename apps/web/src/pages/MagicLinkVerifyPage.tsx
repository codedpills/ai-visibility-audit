import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyMagicLink } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors, fonts } from '../design/tokens';

export function MagicLinkVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [error, setError] = useState('');
  const attempted = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-invoke in dev.
    if (attempted.current) return;
    attempted.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setError('No login token found in the URL. Please request a new link.');
      return;
    }

    verifyMagicLink(token)
      .then(() => refresh())
      .then(() => {
        const redirect = searchParams.get('redirect');
        // Only follow safe relative paths to prevent open redirect
        const destination =
          redirect && redirect.startsWith('/') ? redirect : '/my-audits';
        navigate(destination, { replace: true });
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : 'This link is invalid or has expired. Please request a new one.'
        );
      });
  }, [searchParams, navigate, refresh]);

  return (
    <main style={s.root}>
      <div style={s.card}>
        {error ? (
          <>
            <p style={s.icon}>⚠️</p>
            <h1 style={s.heading}>Link expired</h1>
            <p style={s.sub}>{error}</p>
            <a style={s.link} href="/login">
              Request a new link →
            </a>
          </>
        ) : (
          <>
            <div style={s.spinner} aria-hidden="true" />
            <h1 style={s.heading}>Signing you in…</h1>
            <p style={s.sub}>Verifying your magic link.</p>
          </>
        )}
      </div>
    </main>
  );
}

const spinnerKeyframes = `
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
if (typeof document !== 'undefined') {
  const el = document.createElement('style');
  el.textContent = spinnerKeyframes;
  document.head.appendChild(el);
}

const s = {
  root: {
    background: colors.bg,
    color: colors.text,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: fonts.body,
    padding: '2rem',
  },
  card: {
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center' as const,
    padding: '2.5rem',
    background: colors.bgCard,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
  },
  icon: { fontSize: '2.5rem', margin: '0 0 1rem' },
  heading: {
    fontFamily: fonts.heading,
    fontSize: '1.75rem',
    fontWeight: 800,
    background: colors.gradientText,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 0.75rem',
  },
  sub: { fontSize: '0.9375rem', color: colors.textMuted, lineHeight: 1.6 },
  link: {
    display: 'inline-block',
    marginTop: '1.25rem',
    color: colors.secondary,
    fontSize: '0.9rem',
    textDecoration: 'none',
  },
  spinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: `3px solid ${colors.border}`,
    borderTopColor: colors.secondary,
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1.5rem',
  },
} as const;
