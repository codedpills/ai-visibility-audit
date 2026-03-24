import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAudit } from '../api/client';
import { colors, fonts } from '../design/tokens';

const STATUS_MESSAGES: Record<string, string> = {
  pending: 'Queued — waiting for a worker…',
  running: 'Crawling and analysing your site…',
  done: 'Analysis complete!',
  failed: 'Something went wrong.',
};

const POLL_INTERVAL_MS = 2500;

export function AuditProgressPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;

    async function poll() {
      try {
        const audit = await getAudit(id!);
        if (audit.status === 'done') {
          clearInterval(intervalRef.current!);
          navigate(`/audits/${id}/results`);
        } else if (audit.status === 'failed') {
          clearInterval(intervalRef.current!);
        }
      } catch {
        clearInterval(intervalRef.current!);
      }
    }

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [id, navigate]);

  return (
    <main style={s.root}>
      <div style={s.card}>
        <div style={s.spinner} aria-hidden="true" />
        <h1 style={s.heading}>Auditing your site</h1>
        <p style={s.sub}>{STATUS_MESSAGES['running']}</p>
        <div style={s.steps}>
          {[
            'Crawling up to 10 pages',
            'Extracting signals',
            'Running 8 GEO analyzers',
            'Computing your score',
          ].map((step, i) => (
            <div key={i} style={s.step}>
              <span style={s.stepDot} />
              <span style={s.stepLabel}>{step}</span>
            </div>
          ))}
        </div>
        <p style={s.note}>This usually takes 30–60 seconds</p>
      </div>
    </main>
  );
}

const spinnerKeyframes = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinnerKeyframes;
  document.head.appendChild(style);
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
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center' as const,
  },
  spinner: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: `3px solid ${colors.border}`,
    borderTopColor: colors.secondary,
    animation: 'spin 1s linear infinite',
    margin: '0 auto 2rem',
  },
  heading: {
    fontFamily: fonts.heading,
    fontSize: '2rem',
    fontWeight: 800,
    background: colors.gradientText,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '0.5rem',
  },
  sub: {
    color: colors.textMuted,
    fontSize: '1rem',
    marginBottom: '2rem',
  },
  steps: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    textAlign: 'left' as const,
    marginBottom: '2rem',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.625rem 1rem',
    borderRadius: '8px',
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
  },
  stepDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: colors.gradientButton,
    flexShrink: 0,
  },
  stepLabel: {
    fontSize: '0.9rem',
    color: colors.textMuted,
  },
  note: {
    fontSize: '0.8rem',
    color: colors.textDim,
  },
} as const;
