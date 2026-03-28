import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { colors, fonts } from '../design/tokens';

export function NavBar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav style={s.nav} aria-label="Main navigation">
      <Link to="/" style={s.brand}>
        AI Visibility Audit
      </Link>

      <div style={s.right}>
        {loading ? null : user ? (
          <>
            <span style={s.usageText} title="Audits used this month">
              {user.auditsThisMonth}/{user.monthlyLimit} this month
            </span>
            <Link to="/my-audits" style={s.navLink}>
              My audits
            </Link>
            <span style={s.email}>{user.email}</span>
            <button style={s.logoutBtn} onClick={() => void logout()}>
              Log out
            </button>
          </>
        ) : (
          <Link to="/login" style={s.loginLink}>
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}

const s = {
  nav: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '52px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    borderBottom: `1px solid ${colors.border}`,
    zIndex: 100,
    fontFamily: fonts.body,
  },
  brand: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: colors.text,
    textDecoration: 'none',
    letterSpacing: '-0.01em',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  usageText: {
    fontSize: '0.8rem',
    color: colors.textDim,
  },
  email: {
    fontSize: '0.8rem',
    color: colors.textMuted,
    maxWidth: '180px',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  logoutBtn: {
    background: 'none',
    border: `1px solid ${colors.border}`,
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: '0.8rem',
    padding: '0.3rem 0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  loginLink: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: colors.secondary,
    textDecoration: 'none',
    padding: '0.3rem 0.75rem',
    border: `1px solid ${colors.borderAccent}`,
    borderRadius: '6px',
  },
  navLink: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: colors.secondary,
    textDecoration: 'none',
  },
} as const;
