import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAudit, submitEmail } from '../api/client';
import type {
  AuditResponse,
  CategoryScoreResponse,
  FindingResponse,
  RecommendationResponse,
} from '../api/client';
import { useAuth } from '../auth/AuthContext';
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

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'entity-definition':
    'AI systems need to know who you are before they can recommend you. This checks whether your site clearly defines your brand identity through structured schema markup (Organization, Person, etc.), an About page, and entity-rich content. Without this, AI models may misidentify or omit you entirely.',
  'content-clarity':
    'AI models extract and cite content they can parse quickly. This checks for bullet lists, FAQ sections, plain-language summaries, and short paragraphs — the formats AI systems favour when constructing answers. Dense walls of text are often skipped.',
  'topic-authority':
    'To be recommended by AI, your site needs to be seen as the go-to source on your topic. This measures depth of coverage across related subjects, internal linking, and inbound authority signals. Shallow or scattered content rarely earns citations.',
  'semantic-structure':
    'HTML structure tells AI crawlers how to interpret your document. A single H1, question-phrased H2 headings, and short paragraphs make it far easier for models to extract the right answer from the right section. Poor structure leads to misattribution.',
  'structured-data':
    'JSON-LD markup is a direct channel to AI understanding. It labels your content explicitly — "this is a FAQ", "this is a product", "this organisation does X" — without requiring the model to infer it. Missing structured data is one of the most fixable gaps on most sites.',
  'ai-crawlability':
    'AI training and retrieval systems need permission to access your site. This checks whether your robots.txt allows major AI crawlers (GPTBot, ClaudeBot, Google-Extended) and whether you have an llms.txt file summarising your site for AI agents.',
  'brand-authority':
    'AI models learn who to trust from external signals — Wikipedia mentions, industry publication coverage, and brand co-citations. A site that is only known to itself rarely surfaces in AI-generated recommendations or answers.',
  'ai-answerability':
    'The clearest predictor of AI citation is whether your content directly answers the questions your audience asks. This checks for concise, factual, question-answering language on your site. Vague or promotional copy is the least likely to be quoted by an AI.',
};

function CategoryCard({
  cs,
  finding,
}: {
  cs: CategoryScoreResponse;
  finding?: FindingResponse;
}) {
  const [open, setOpen] = useState(false);
  const pct = Math.round((cs.score / cs.maxScore) * 100);
  const color = scoreColor(cs.score, cs.maxScore);
  const description = CATEGORY_DESCRIPTIONS[cs.category];

  return (
    <div style={s.catCard}>
      {/* Clickable header row */}
      <button
        style={s.catButton}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div style={s.catHeaderInner}>
          <span style={s.catLabel}>{cs.label}</span>
          <div style={s.catRight}>
            <span style={{ ...s.catScore, color }}>
              {cs.score}
              <span style={s.catMax}>/{cs.maxScore}</span>
            </span>
            <span
              style={{
                ...s.catChevron,
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              ▾
            </span>
          </div>
        </div>
        <div style={s.barTrack}>
          <div style={{ ...s.barFill, width: `${pct}%`, background: color }} />
        </div>
      </button>

      {/* Accordion body */}
      {open && (
        <div style={s.catBody}>
          {description && <p style={s.catDescription}>{description}</p>}
          {finding && finding.details && (
            <p style={s.catFinding}>
              <strong>Detected on your site: </strong>
              {finding.details}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

function RecommendationCard({ rec }: { rec: RecommendationResponse }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={s.recCard}>
      <div style={s.recHeader}>
        <span
          style={{
            ...s.recBadge,
            background: PRIORITY_COLOR[rec.priority] + '22',
            color: PRIORITY_COLOR[rec.priority],
          }}
        >
          {rec.priority}
        </span>
        <strong style={s.recTitle}>{rec.title}</strong>
      </div>
      <p style={s.recDesc}>{rec.description}</p>
      {rec.snippet && (
        <>
          <button style={s.snippetToggle} onClick={() => setOpen((v) => !v)}>
            {open ? 'Hide snippet ↑' : 'Show code snippet ↓'}
          </button>
          {open && <pre style={s.snippet}>{rec.snippet}</pre>}
        </>
      )}
    </div>
  );
}

function EmailGate({ auditId }: { auditId: string }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await submitEmail(auditId, email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div style={s.gate}>
        <h3 style={s.gateTitle}>Check your inbox ✉️</h3>
        <p style={s.gateDesc}>
          We've sent a login link to <strong>{email}</strong>. Click it to view
          your full report with all recommendations and code examples. The link
          expires in 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <div style={s.gate}>
      <h3 style={s.gateTitle}>Unlock the Full Report</h3>
      <p style={s.gateDesc}>
        Enter your email to get all recommendations with code examples — free,
        no spam. We'll send you a magic link that logs you in and takes you
        straight to your full report.
      </p>
      <form onSubmit={handleSubmit} style={s.gateForm}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          style={s.gateInput}
        />
        <button type="submit" disabled={loading} style={s.gateButton}>
          {loading ? 'Sending…' : 'Email me the full report →'}
        </button>
      </form>
      {error && (
        <p
          style={{
            color: colors.error,
            marginTop: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

function ExpiryBanner({ expiresAt }: { expiresAt: string }) {
  const days = Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)
  );
  const urgent = days <= 1;
  return (
    <div
      style={{
        ...s.expiryBanner,
        borderColor: urgent ? '#ef4444' : colors.border,
        color: urgent ? '#ef4444' : colors.textMuted,
      }}
    >
      {days === 0
        ? 'Your audit expires today.'
        : `Your audit results expire in ${days} day${days === 1 ? '' : 's'}.`}
    </div>
  );
}

export function AuditResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
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

  const isLoggedIn = !!user;
  const geoScore = audit.geoScore ?? 0;
  const grade = scoreGrade(geoScore);
  const catScores = audit.categoryScores ?? [];
  const findings = audit.findings ?? [];
  const allRecs = audit.recommendations ?? [];
  const previewRecs = allRecs
    .filter((r) => r.priority === 'critical')
    .slice(0, 3);
  const isUnlocked = isLoggedIn;
  const displayedRecs = isUnlocked ? allRecs : previewRecs;

  return (
    <main style={s.root}>
      {/* Print CSS — hides UI chrome when printing */}
      <style>{`
        @media print {
          nav, aside, .no-print { display: none !important; }
          body { background: #fff; color: #111; }
          a { color: #4A2574; }
        }
      `}</style>

      <div style={s.container}>
        {/* Expiry banner */}
        {audit.expiresAt && <ExpiryBanner expiresAt={audit.expiresAt} />}

        {/* Header */}
        <div style={s.header}>
          <Link to={isLoggedIn ? '/my-audits' : '/'} style={s.link}>
            {isLoggedIn ? '← My audits' : '← Run another audit'}
          </Link>
          <div style={s.headerRight}>
            <p style={s.auditUrl}>{audit.url}</p>
            {isLoggedIn && (
              <button
                className="no-print"
                style={s.pdfButton}
                onClick={() => window.print()}
              >
                ↓ Download Report
              </button>
            )}
          </div>
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
              <CategoryCard
                key={cs.category}
                cs={cs}
                finding={findings.find((f) => f.category === cs.category)}
              />
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>
            {isUnlocked ? 'All Recommendations' : 'Top Critical Issues'}
          </h2>

          {previewRecs.length === 0 && !isUnlocked && (
            <p style={{ color: colors.textMuted, fontSize: '0.95rem' }}>
              No critical issues found — great work!
            </p>
          )}

          <div style={s.catGrid}>
            {displayedRecs.map((rec, i) => (
              <RecommendationCard key={i} rec={rec} />
            ))}
          </div>

          {!isUnlocked && id && <EmailGate auditId={id} />}
        </section>
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
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap' as const,
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
    background: colors.bgCard,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  },
  catButton: {
    width: '100%',
    background: 'none',
    border: 'none',
    padding: '1rem 1.25rem',
    cursor: 'pointer',
    textAlign: 'left' as const,
    color: colors.text,
  },
  catHeaderInner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '0.625rem',
  },
  catRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
  },
  catChevron: {
    fontSize: '0.9rem',
    color: colors.textMuted,
    transition: 'transform 0.2s ease',
    display: 'inline-block',
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
  catDescription: {
    fontSize: '0.875rem',
    color: colors.textMuted,
    lineHeight: 1.6,
    margin: 0,
  },
  catFinding: {
    fontSize: '0.825rem',
    color: colors.textDim,
    lineHeight: 1.5,
    margin: '0.625rem 0 0',
    borderTop: `1px solid ${colors.border}`,
    paddingTop: '0.625rem',
  },
  catBody: {
    padding: '0 1.25rem 1rem',
    borderTop: `1px solid ${colors.border}`,
    paddingTop: '0.875rem',
  },
  pdfButton: {
    background: 'none',
    border: `1px solid ${colors.border}`,
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: '0.8rem',
    padding: '0.3rem 0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
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
  // Recommendation cards
  recCard: {
    padding: '1rem 1.25rem',
    background: colors.bgCard,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
  },
  recHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.5rem',
  },
  recBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    flexShrink: 0,
  },
  recTitle: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: colors.text,
  },
  recDesc: {
    fontSize: '0.875rem',
    color: colors.textMuted,
    lineHeight: 1.55,
    marginBottom: '0.5rem',
  },
  snippetToggle: {
    background: 'none',
    border: 'none',
    color: colors.secondary,
    cursor: 'pointer',
    fontSize: '0.8rem',
    padding: 0,
    marginBottom: '0.5rem',
  },
  snippet: {
    background: '#0d0d0d',
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    padding: '0.875rem 1rem',
    fontSize: '0.78rem',
    color: '#c9fafe',
    overflowX: 'auto' as const,
    lineHeight: 1.6,
    whiteSpace: 'pre' as const,
  },
  // Email gate
  gate: {
    marginTop: '1.5rem',
    padding: '1.5rem',
    background: colors.bgCard,
    borderRadius: radius.lg,
    border: `1px solid ${colors.borderAccent}`,
    textAlign: 'center' as const,
  },
  gateTitle: {
    fontFamily: fonts.heading,
    fontSize: '1.1rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
  },
  gateDesc: {
    color: colors.textMuted,
    fontSize: '0.9rem',
    marginBottom: '1.25rem',
  },
  gateForm: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  gateInput: {
    flex: '1 1 220px',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    background: '#1a1a1a',
    color: colors.text,
    fontSize: '0.95rem',
    outline: 'none',
  },
  gateButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    background: colors.primary,
    color: colors.text,
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  // Expiry banner
  expiryBanner: {
    padding: '0.625rem 1rem',
    borderRadius: radius.md,
    border: '1px solid',
    fontSize: '0.85rem',
    textAlign: 'center' as const,
    marginBottom: '1.25rem',
    marginTop: '2.25rem',
  },
  // Legacy (kept to avoid breaking anything)
  footer: { display: 'none' },
  footerText: { display: 'none' },
  ctaButton: { display: 'none' },
} as const;
