import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitAudit } from '../api/client';
import { colors, fonts } from '../design/tokens';

export function HomePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    let normalised = url.trim();
    if (normalised && !/^https?:\/\//i.test(normalised)) {
      normalised = 'https://' + normalised;
    }

    if (!normalised) {
      setError('Please enter your website URL.');
      return;
    }

    try {
      new URL(normalised);
    } catch {
      setError('Please enter a valid URL, e.g. https://yourcompany.com');
      return;
    }

    setLoading(true);
    try {
      const { auditId } = await submitAudit(normalised);
      navigate(`/audits/${auditId}/progress`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <main style={s.root}>
      <div style={s.content}>
        <p style={s.eyebrow}>Free AI Visibility Audit</p>
        <h1 style={s.heading}>Is your website invisible to AI?</h1>
        <p style={s.sub}>
          Find out in 60 seconds. We analyse your site across 8 GEO signals and
          give you an actionable score — free, no signup required.
        </p>

        <form style={s.form} onSubmit={handleSubmit} noValidate>
          <input
            style={s.input}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourcompany.com"
            aria-label="Website URL"
            disabled={loading}
            autoFocus
          />
          <button
            style={loading ? { ...s.button, opacity: 0.6 } : s.button}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Starting…' : 'Run Free Audit →'}
          </button>
        </form>

        {error && <p style={s.error}>{error}</p>}

        <div style={s.signals}>
          {[
            'Entity Definition',
            'Content Clarity',
            'Topic Authority',
            'Semantic Structure',
            'Structured Data',
            'AI Crawlability',
            'Brand Authority',
            'AI Answerability',
          ].map((label) => (
            <span key={label} style={s.signal}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}

const s = {
  root: {
    background: colors.bg,
    color: colors.text,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: fonts.body,
    padding: '2rem',
    textAlign: 'center' as const,
  },
  content: {
    maxWidth: '640px',
    width: '100%',
  },
  eyebrow: {
    fontSize: '0.75rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: colors.secondary,
    marginBottom: '1rem',
  },
  heading: {
    fontFamily: fonts.heading,
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    fontWeight: 800,
    margin: '0 0 1rem',
    background: colors.gradientText,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  sub: {
    fontSize: '1.0625rem',
    color: colors.textMuted,
    lineHeight: 1.6,
    marginBottom: '2.5rem',
  },
  form: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minWidth: '220px',
    padding: '0.875rem 1rem',
    borderRadius: '8px',
    border: `1px solid ${colors.borderAccent}`,
    background: colors.bgCard,
    color: colors.text,
    fontSize: '1rem',
    outline: 'none',
    fontFamily: fonts.body,
  },
  button: {
    padding: '0.875rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    background: colors.gradientButton,
    color: colors.text,
    fontFamily: fonts.body,
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'opacity 0.2s',
  },
  error: {
    marginTop: '1rem',
    color: colors.error,
    fontSize: '0.9rem',
  },
  signals: {
    marginTop: '3rem',
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    justifyContent: 'center',
  },
  signal: {
    fontSize: '0.75rem',
    padding: '0.25rem 0.625rem',
    borderRadius: '20px',
    border: `1px solid ${colors.border}`,
    color: colors.textMuted,
    letterSpacing: '0.03em',
  },
} as const;
