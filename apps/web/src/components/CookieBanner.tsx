import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { posthog } from '../analytics/posthog';
import { colors, fonts, radius } from '../design/tokens';

type ConsentState = 'accepted' | 'declined' | null;

const STORAGE_KEY = 'cookie_consent';

function getStoredConsent(): ConsentState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'accepted' || stored === 'declined') return stored;
  } catch {
    // localStorage unavailable (e.g. private browsing with strict settings)
  }
  return null;
}

function storeConsent(value: 'accepted' | 'declined') {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  // On mount, apply any previously stored consent silently (no banner).
  // If no decision has been made yet, show the banner.
  useEffect(() => {
    const stored = getStoredConsent();
    if (stored === 'accepted') {
      posthog.opt_in_capturing();
    } else if (stored === 'declined') {
      posthog.opt_out_capturing();
    } else {
      setVisible(true);
    }
  }, []);

  function handleAccept() {
    storeConsent('accepted');
    posthog.opt_in_capturing();
    setVisible(false);
  }

  function handleDecline() {
    storeConsent('declined');
    posthog.opt_out_capturing();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={s.overlay} role="region" aria-label="Cookie consent">
      <div style={s.content}>
        <p style={s.text}>
          We use analytics cookies to understand how you use this site and
          improve it.{' '}
          <Link to="/privacy" style={s.link}>
            Privacy Policy
          </Link>
        </p>
        <div style={s.buttons}>
          <button style={s.declineBtn} onClick={handleDecline}>
            Decline
          </button>
          <button style={s.acceptBtn} onClick={handleAccept}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: colors.bgCard,
    borderTop: `1px solid ${colors.border}`,
    padding: '16px 24px',
  },
  content: {
    maxWidth: '960px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
    flexWrap: 'wrap' as const,
  },
  text: {
    margin: 0,
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: '14px',
    lineHeight: '1.5',
    flex: '1 1 300px',
  },
  link: {
    color: colors.secondary,
    textDecoration: 'none',
  },
  buttons: {
    display: 'flex',
    gap: '10px',
    flexShrink: 0 as const,
  },
  declineBtn: {
    padding: '8px 18px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: 'transparent',
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: '14px',
    cursor: 'pointer' as const,
  },
  acceptBtn: {
    padding: '8px 18px',
    borderRadius: radius.sm,
    border: 'none',
    background: colors.gradientButton,
    color: '#ffffff',
    fontFamily: fonts.body,
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer' as const,
  },
};
