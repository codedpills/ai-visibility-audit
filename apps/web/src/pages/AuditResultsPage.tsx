import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAudit } from '../api/client';
import type { AuditResponse, CategoryScoreResponse } from '../api/client';
import { colors, fonts, radius } from '../design/tokens';

function scoreColor(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.8) return colors.success;
  if (pct >= 0.5) return colors.warning;
  return colors.error;
}

function scoreGrade(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function ScoreRing({ score, max }: { score: number; max: number }) {
  const size = 160;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = score / max;
  const dash = circumference * pct;
  const color = scoreColor(score, max);

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        margin: '0 auto',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors.border}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: '2.25rem',
            fontWeight: 800,
            color,
          }}
        >
          {score}
        </span>
        <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>
          out of {max}
        </span>
      </div>
    </div>
  );
}

function CategoryCard({ cs }: { cs: CategoryScoreResponse }) {
  const pct = Math.round((cs.score / cs.maxScore) * 100);
  const color = scoreColor(cs.score, cs.maxScore);
  return (
    <div style={s.catCard}>
      <div style={s.catHeader}>
        <span style={s.catLabel}>{cs.label}</span>
        <span style={{ ...s.catScore, color }}>
          {cs.score}
          <span style={s.catMax}>/{cs.maxScore}</span>
        </span>
      </div>
      <div style={s.barTrack}>
        <div style={{ ...s.barFill, width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function AuditResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<AuditResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getAudit(id)
      .then(setAudit)
      .catch(() => setError('Could not load audit results.'));
  }, [id]);

  if (error) {
    return (
      <main style={s.root}>
        <p style={{ color: colors.error }}>{error}</p>
        <Link to="/" style={s.link}>
          ← Run a new audit
        </Link>
      </main>
    );
  }

  if (!audit) {
    return (
      <main style={s.root}>
        <p style={{ color: colors.textMuted }}>Loading results…</p>
      </main>
    );
  }

  if (audit.status !== 'done') {
    return (
      <main style={s.root}>
        <p style={{ color: colors.textMuted }}>
          Audit is still {audit.status}.
        </p>
        <Link to={`/audits/${id}/progress`} style={s.link}>
          View progress →
        </Link>
      </main>
    );
  }

  const geoScore = audit.geoScore ?? 0;
  const grade = scoreGrade(geoScore);
  const catScores = audit.categoryScores ?? [];

  return (
    <main style={s.root}>
      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <Link to="/" style={s.link}>
            ← Run another audit
          </Link>
          <p style={s.auditUrl}>{audit.url}</p>
        </div>

        {/* Score hero */}
        <div style={s.hero}>
          <ScoreRing score={geoScore} max={100} />
          <div style={s.heroText}>
            <div style={s.gradeRow}>
              <span style={{ ...s.grade, color: scoreColor(geoScore, 100) }}>
                {grade}
              </span>
              <span style={s.gradeLabel}>GEO Score</span>
            </div>
            <p style={s.heroSub}>
              {geoScore >= 70
                ? 'Your site is well-optimised for AI visibility.'
                : geoScore >= 45
                  ? 'Your site has a good foundation — improvements will help.'
                  : 'Your site needs work to become visible to AI search.'}
            </p>
          </div>
        </div>

        {/* Category breakdown */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Category Breakdown</h2>
          <div style={s.catGrid}>
            {catScores.map((cs) => (
              <CategoryCard key={cs.category} cs={cs} />
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <div style={s.footer}>
          <p style={s.footerText}>
            Want detailed recommendations and a PDF report?
          </p>
          <button style={s.ctaButton} disabled>
            Unlock Full Report (coming soon)
          </button>
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
    fontFamily: fonts.body,
    padding: '2rem 1rem',
  },
  container: {
    maxWidth: '720px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    marginBottom: '2.5rem',
  },
  link: {
    color: colors.secondary,
    textDecoration: 'none',
    fontSize: '0.9rem',
  },
  auditUrl: {
    color: colors.textMuted,
    fontSize: '0.85rem',
    wordBreak: 'break-all' as const,
  },
  hero: {
    display: 'flex',
    alignItems: 'center',
    gap: '2.5rem',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    marginBottom: '3rem',
    padding: '2rem',
    background: colors.bgCard,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
  },
  heroText: {
    flex: 1,
    minWidth: '200px',
  },
  gradeRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.75rem',
    marginBottom: '0.5rem',
  },
  grade: {
    fontFamily: fonts.heading,
    fontSize: '4rem',
    fontWeight: 800,
    lineHeight: 1,
  },
  gradeLabel: {
    fontSize: '0.9rem',
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  heroSub: {
    color: colors.textMuted,
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  section: {
    marginBottom: '2.5rem',
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: colors.text,
  },
  catGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  catCard: {
    padding: '1rem 1.25rem',
    background: colors.bgCard,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
  },
  catHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '0.625rem',
  },
  catLabel: {
    fontSize: '0.95rem',
    fontWeight: 500,
  },
  catScore: {
    fontFamily: fonts.heading,
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  catMax: {
    fontSize: '0.75rem',
    color: colors.textMuted,
    fontWeight: 400,
  },
  barTrack: {
    height: '6px',
    borderRadius: '3px',
    background: colors.border,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.6s ease',
  },
  footer: {
    textAlign: 'center' as const,
    padding: '2rem',
    background: colors.bgCard,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
  },
  footerText: {
    color: colors.textMuted,
    marginBottom: '1rem',
  },
  ctaButton: {
    padding: '0.875rem 2rem',
    borderRadius: '8px',
    border: 'none',
    background: colors.gradientButton,
    color: colors.text,
    fontFamily: fonts.body,
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'not-allowed',
    opacity: 0.5,
  },
} as const;
