import { Link } from 'react-router-dom';
import { colors, fonts, radius } from '../design/tokens';

export function PrivacyPolicyPage() {
  return (
    <main style={s.root}>
      <div style={s.container}>
        <Link to="/" style={s.back}>
          ← Back to home
        </Link>

        <h1 style={s.h1}>Privacy Policy</h1>
        <p style={s.lastUpdated}>Last updated: April 2026</p>

        <Section title="1. Who we are">
          <p>
            AI Visibility Audit is a free, open-source tool operated by
            codedpills. The source code is available at{' '}
            <ExternalLink href="https://github.com/codedpills/ai-visibility-audit">
              github.com/codedpills/ai-visibility-audit
            </ExternalLink>
            . For privacy enquiries, please open a GitHub issue or email{' '}
            <a href="mailto:privacy@aivisibilityaudit.cc" style={s.link}>
              privacy@aivisibilityaudit.cc
            </a>
            .
          </p>
        </Section>

        <Section title="2. What data we collect and why">
          <SubSection title="2a. URLs you submit for auditing">
            <p>
              When you run an audit, we store the URL you provide along with the
              audit results. We use this to display your results, run the
              analysis, and — for registered users — keep a history in your
              account.
            </p>
            <p>
              <strong>Legal basis:</strong> Contractual necessity (providing the
              service you requested).
            </p>
          </SubSection>

          <SubSection title="2b. Email address">
            <p>
              If you choose to receive your full report or create an account, we
              ask for your email address. We use it to:
            </p>
            <ul style={s.ul}>
              <li>Send a magic-link login email (via Resend)</li>
              <li>Deliver your audit results link</li>
            </ul>
            <p>
              We do not send marketing emails. Your email is not sold or shared
              with third parties for advertising.
            </p>
            <p>
              <strong>Legal basis:</strong> Contractual necessity.
            </p>
          </SubSection>

          <SubSection title="2c. Analytics (with your consent only)">
            <p>
              We use{' '}
              <ExternalLink href="https://posthog.com">PostHog</ExternalLink> to
              understand how the tool is used — page visits, audit submissions,
              and general usage patterns. This helps us improve the product.
            </p>
            <p>
              PostHog analytics are{' '}
              <strong>only activated after you give consent</strong> via the
              cookie banner. If you decline, no analytics data is collected. You
              can change your preference at any time by clearing your
              browser&apos;s local storage for this site.
            </p>
            <p>
              When analytics are enabled, PostHog may collect: pages visited,
              events triggered (e.g. &quot;audit submitted&quot;), browser type,
              operating system, and a hashed/anonymised IP address.
            </p>
            <p>
              <strong>Legal basis:</strong> Consent (GDPR Art. 6(1)(a)).
            </p>
          </SubSection>

          <SubSection title="2d. Technical logs">
            <p>
              Our hosting provider (Railway) retains standard server access logs
              (HTTP request metadata including IP address) for security and
              operational purposes. These are managed under Railway&apos;s own
              data retention policy.
            </p>
            <p>
              <strong>Legal basis:</strong> Legitimate interest (security and
              service reliability).
            </p>
          </SubSection>
        </Section>

        <Section title="3. Data retention">
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, ...s.tdFirst }}>Data type</th>
                <th style={s.th}>Retention period</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...s.td, ...s.tdFirst }}>
                  Audit results (anonymous users)
                </td>
                <td style={s.td}>7 days, then automatically deleted</td>
              </tr>
              <tr>
                <td style={{ ...s.td, ...s.tdFirst }}>
                  Audit results (registered users)
                </td>
                <td style={s.td}>30 days, then automatically deleted</td>
              </tr>
              <tr>
                <td style={{ ...s.td, ...s.tdFirst }}>Email address</td>
                <td style={s.td}>Until account deletion is requested</td>
              </tr>
              <tr>
                <td style={{ ...s.td, ...s.tdFirst }}>
                  Analytics data (PostHog)
                </td>
                <td style={s.td}>1 year (PostHog default)</td>
              </tr>
              <tr>
                <td style={{ ...s.td, ...s.tdFirst }}>Server access logs</td>
                <td style={s.td}>
                  As per Railway&apos;s policy (typically 30 days)
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="4. Third-party processors">
          <p>
            We share data with the following sub-processors, each operating
            under their own privacy policy:
          </p>
          <ul style={s.ul}>
            <li>
              <ExternalLink href="https://resend.com/privacy">
                Resend
              </ExternalLink>{' '}
              — transactional email delivery (magic links, audit result emails)
            </li>
            <li>
              <ExternalLink href="https://posthog.com/privacy">
                PostHog
              </ExternalLink>{' '}
              — product analytics (consent-gated; US region)
            </li>
            <li>
              <ExternalLink href="https://www.firecrawl.dev">
                Firecrawl
              </ExternalLink>{' '}
              — web crawling of the URLs you submit for auditing
            </li>
            <li>
              <ExternalLink href="https://railway.app/legal/privacy">
                Railway
              </ExternalLink>{' '}
              — cloud hosting and infrastructure
            </li>
            <li>
              <ExternalLink href="https://openai.com/policies/privacy-policy">
                OpenAI
              </ExternalLink>{' '}
              — used by the AI Answerability analyser (your site content, not
              your personal data, is sent to OpenAI)
            </li>
          </ul>
        </Section>

        <Section title="5. Your rights">
          <p>
            Under GDPR (if you are in the EEA or UK) and similar laws, you have
            the right to:
          </p>
          <ul style={s.ul}>
            <li>
              <strong>Access</strong> — request a copy of the personal data we
              hold about you
            </li>
            <li>
              <strong>Rectification</strong> — ask us to correct inaccurate data
            </li>
            <li>
              <strong>Erasure</strong> — ask us to delete your data (&quot;right
              to be forgotten&quot;)
            </li>
            <li>
              <strong>Restriction</strong> — ask us to restrict processing in
              certain circumstances
            </li>
            <li>
              <strong>Portability</strong> — receive your data in a
              machine-readable format
            </li>
            <li>
              <strong>Objection</strong> — object to processing based on
              legitimate interest
            </li>
            <li>
              <strong>Withdraw consent</strong> — withdraw analytics consent at
              any time (see Section 6)
            </li>
          </ul>
          <p>
            To exercise any of these rights, please email{' '}
            <a href="mailto:privacy@aivisibilityaudit.cc" style={s.link}>
              privacy@aivisibilityaudit.cc
            </a>{' '}
            or open a{' '}
            <ExternalLink href="https://github.com/codedpills/ai-visibility-audit/issues">
              GitHub issue
            </ExternalLink>
            . We will respond within 30 days.
          </p>
        </Section>

        <Section title="6. Managing cookie and analytics consent">
          <p>
            When you first visit the site, a banner asks whether you consent to
            analytics cookies. Your choice is stored in your browser&apos;s
            local storage (key: <code style={s.code}>cookie_consent</code>).
          </p>
          <p>
            To change your preference, clear your browser&apos;s local storage
            for <code style={s.code}>aivisibilityaudit.cc</code> — the banner
            will reappear on your next visit. You can do this in your
            browser&apos;s Developer Tools under Application → Local Storage.
          </p>
          <p>
            If you decline analytics, no tracking data is sent to PostHog. The
            core auditing functionality works fully without analytics consent.
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>We use the following storage mechanisms:</p>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, ...s.tdFirst }}>Name</th>
                <th style={s.th}>Type</th>
                <th style={s.th}>Purpose</th>
                <th style={s.th}>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...s.td, ...s.tdFirst }}>
                  <code style={s.code}>session</code>
                </td>
                <td style={s.td}>HttpOnly cookie</td>
                <td style={s.td}>Keeps you logged in</td>
                <td style={s.td}>7 days</td>
              </tr>
              <tr>
                <td style={{ ...s.td, ...s.tdFirst }}>
                  <code style={s.code}>cookie_consent</code>
                </td>
                <td style={s.td}>localStorage</td>
                <td style={s.td}>Stores your analytics consent choice</td>
                <td style={s.td}>Persistent until cleared</td>
              </tr>
              <tr>
                <td style={{ ...s.td, ...s.tdFirst }}>
                  <code style={s.code}>ph_*</code>
                </td>
                <td style={s.td}>localStorage (PostHog)</td>
                <td style={s.td}>
                  Analytics session tracking (only set if you accept)
                </td>
                <td style={s.td}>1 year</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="8. Changes to this policy">
          <p>
            We may update this policy from time to time. The &quot;Last
            updated&quot; date at the top of this page will reflect any changes.
            Significant changes will be noted in the project&apos;s{' '}
            <ExternalLink href="https://github.com/codedpills/ai-visibility-audit">
              GitHub repository
            </ExternalLink>
            .
          </p>
        </Section>

        <div style={s.contact}>
          <p style={s.contactText}>
            Questions?{' '}
            <a href="mailto:privacy@aivisibilityaudit.cc" style={s.link}>
              privacy@aivisibilityaudit.cc
            </a>
            {' · '}
            <ExternalLink href="https://github.com/codedpills/ai-visibility-audit/issues">
              Open a GitHub issue
            </ExternalLink>
          </p>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={sSection.root}>
      <h2 style={sSection.h2}>{title}</h2>
      <div style={sSection.body}>{children}</div>
    </section>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={sSection.subSection}>
      <h3 style={sSection.h3}>{title}</h3>
      {children}
    </div>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} style={s.link} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

const s = {
  root: {
    background: colors.bg,
    minHeight: '100vh',
    paddingTop: '80px',
    paddingBottom: '80px',
  },
  container: {
    maxWidth: '760px',
    margin: '0 auto',
    padding: '0 24px',
  },
  back: {
    display: 'inline-block',
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: '14px',
    textDecoration: 'none',
    marginBottom: '32px',
  },
  h1: {
    fontFamily: fonts.heading,
    fontSize: 'clamp(28px, 5vw, 40px)',
    fontWeight: 700,
    color: colors.text,
    margin: '0 0 8px',
    lineHeight: 1.2,
  },
  lastUpdated: {
    color: colors.textDim,
    fontFamily: fonts.body,
    fontSize: '14px',
    margin: '0 0 48px',
  },
  ul: {
    margin: '8px 0 16px',
    paddingLeft: '24px',
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: '15px',
    lineHeight: 1.7,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontFamily: fonts.body,
    fontSize: '14px',
    margin: '12px 0',
  },
  th: {
    textAlign: 'left' as const,
    padding: '10px 14px',
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text,
    fontWeight: 600,
    background: colors.bgCard,
  },
  td: {
    padding: '10px 14px',
    borderBottom: `1px solid ${colors.border}`,
    color: colors.textMuted,
    verticalAlign: 'top' as const,
  },
  tdFirst: {
    borderRadius: `${radius.sm} 0 0 ${radius.sm}`,
  },
  link: {
    color: colors.secondary,
    textDecoration: 'none',
  },
  code: {
    fontFamily: 'monospace',
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: '4px',
    padding: '1px 5px',
    fontSize: '13px',
    color: colors.text,
  },
  contact: {
    marginTop: '56px',
    paddingTop: '24px',
    borderTop: `1px solid ${colors.border}`,
  },
  contactText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: '14px',
    margin: 0,
  },
};

const sSection = {
  root: {
    marginBottom: '40px',
  },
  h2: {
    fontFamily: fonts.heading,
    fontSize: '20px',
    fontWeight: 700,
    color: colors.text,
    margin: '0 0 16px',
    paddingBottom: '8px',
    borderBottom: `1px solid ${colors.border}`,
  },
  h3: {
    fontFamily: fonts.heading,
    fontSize: '16px',
    fontWeight: 600,
    color: colors.text,
    margin: '20px 0 8px',
  },
  body: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: '15px',
    lineHeight: 1.7,
  },
  subSection: {
    marginBottom: '16px',
  },
};
