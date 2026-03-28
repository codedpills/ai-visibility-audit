import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitAudit } from '../api/client';
import { colors, fonts } from '../design/tokens';

const HOW_IT_WORKS = [
  {
    n: '1',
    title: 'Enter your URL',
    desc: 'Paste any website URL. No account needed.',
  },
  {
    n: '2',
    title: 'Crawl & analyse',
    desc: 'We crawl up to 10 pages and run 8 GEO signal analysers.',
  },
  {
    n: '3',
    title: 'See your score',
    desc: 'Get a breakdown across all 8 categories, scored out of 100.',
  },
  {
    n: '4',
    title: 'Fix what matters',
    desc: 'Unlock the full prioritised recommendation list to start improving.',
  },
];

const FAQS = [
  {
    q: 'What is GEO (Generative Engine Optimisation)?',
    a: 'GEO is the practice of optimising your website so AI language models — ChatGPT, Claude, Gemini — can understand, cite, and recommend your content. Unlike traditional SEO, GEO focuses on how AI systems extract and interpret information from your pages.',
  },
  {
    q: 'How is the GEO score calculated?',
    a: 'Your score is calculated across 8 categories: Entity Definition (15 pts), Content Clarity (15 pts), Topic Authority (15 pts), Brand Authority (15 pts), Semantic Structure (10 pts), Structured Data (10 pts), AI Crawlability (10 pts), and AI Answerability (10 pts).',
  },
  {
    q: 'Is this tool really free?',
    a: 'Yes. AI Visibility Audit is completely free. Anonymous visitors can run 1 audit per day. Registered users (email only, no password) can run up to 3 per month and keep results for 30 days. The project is donation-supported via Ko-fi.',
  },
  {
    q: 'What AI systems is this optimised for?',
    a: 'The audit analyses signals relevant to all major AI systems: ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google), and Perplexity AI. The AI Crawlability category checks whether GPTBot, ClaudeBot, PerplexityBot, and Google-Extended are permitted in your robots.txt.',
  },
  {
    q: 'How many pages does it crawl?',
    a: 'The tool crawls up to 10 pages from your domain, always respecting your robots.txt rules. It analyses GEO signals from all crawled pages and aggregates them into a final score.',
  },
];

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

        {/* How it works — matches HowTo JSON-LD in index.html */}
        <section aria-labelledby="how-it-works" style={s.section}>
          <h2 id="how-it-works" style={s.sectionHeading}>
            How it works
          </h2>
          <div style={s.stepGrid}>
            {HOW_IT_WORKS.map((step) => (
              <div key={step.n} style={s.stepCard}>
                <span style={s.stepNum}>{step.n}</span>
                <div>
                  <strong style={s.stepTitle}>{step.title}</strong>
                  <p style={s.stepDesc}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ — matches FAQPage JSON-LD in index.html */}
        <section aria-labelledby="faq" style={s.section}>
          <h2 id="faq" style={s.sectionHeading}>
            Frequently asked questions
          </h2>
          <div style={s.faqList}>
            {FAQS.map((faq) => (
              <div key={faq.q} style={s.faqItem}>
                <h3 style={s.faqQ}>{faq.q}</h3>
                <p style={s.faqA}>{faq.a}</p>
              </div>
            ))}
          </div>
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
  section: {
    marginTop: '4rem',
    textAlign: 'left' as const,
  },
  sectionHeading: {
    fontFamily: fonts.heading,
    fontSize: '1.375rem',
    fontWeight: 700,
    color: colors.text,
    marginBottom: '1.5rem',
    textAlign: 'center' as const,
  },
  // How it works
  stepGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1rem',
  },
  stepCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '1rem 1.25rem',
    borderRadius: '10px',
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
  },
  stepNum: {
    flexShrink: 0,
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: colors.gradientButton,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: colors.text,
  },
  stepTitle: {
    display: 'block',
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: colors.text,
    marginBottom: '0.25rem',
  },
  stepDesc: {
    fontSize: '0.85rem',
    color: colors.textMuted,
    lineHeight: 1.5,
    margin: 0,
  },
  // FAQ
  faqList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  faqItem: {
    padding: '1.25rem',
    borderRadius: '10px',
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    textAlign: 'left' as const,
  },
  faqQ: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: colors.text,
    margin: '0 0 0.5rem',
  },
  faqA: {
    fontSize: '0.875rem',
    color: colors.textMuted,
    lineHeight: 1.6,
    margin: 0,
  },
} as const;
