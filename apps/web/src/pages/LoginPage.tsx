import { useState } from 'react';
import { sendMagicLink } from '../api/client';
import { colors, fonts } from '../design/tokens';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await sendMagicLink(trimmed);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={s.root}>
      <div style={s.card}>
        {sent ? (
          <>
            <p style={s.icon}>✉️</p>
            <h1 style={s.heading}>Check your inbox</h1>
            <p style={s.sub}>
              We sent a login link to <strong>{email}</strong>. It expires in 15
              minutes.
            </p>
            <p style={s.note}>No email? Check your spam folder.</p>
          </>
        ) : (
          <>
            <h1 style={s.heading}>Sign in</h1>
            <p style={s.sub}>
              Enter your email and we'll send you a magic link — no password
              needed.
            </p>
            <form style={s.form} onSubmit={handleSubmit} noValidate>
              <input
                style={s.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                disabled={loading}
                autoFocus
              />
              <button
                style={loading ? { ...s.button, opacity: 0.6 } : s.button}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send magic link →'}
              </button>
            </form>
            {error && <p style={s.error}>{error}</p>}
            <p style={s.privacy}>
              We only use your email for login. No marketing emails.
            </p>
          </>
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: fonts.body,
    padding: '2rem',
  },
  card: {
    maxWidth: '420px',
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
  sub: {
    fontSize: '0.9375rem',
    color: colors.textMuted,
    lineHeight: 1.6,
    marginBottom: '1.75rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  input: {
    padding: '0.875rem 1rem',
    borderRadius: '8px',
    border: `1px solid ${colors.borderAccent}`,
    background: colors.bg,
    color: colors.text,
    fontSize: '1rem',
    outline: 'none',
    fontFamily: fonts.body,
    width: '100%',
    boxSizing: 'border-box' as const,
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
    transition: 'opacity 0.2s',
  },
  error: { marginTop: '0.75rem', color: colors.error, fontSize: '0.875rem' },
  privacy: {
    marginTop: '1.25rem',
    fontSize: '0.8rem',
    color: colors.textDim,
  },
  note: { fontSize: '0.875rem', color: colors.textDim, marginTop: '0.5rem' },
} as const;
