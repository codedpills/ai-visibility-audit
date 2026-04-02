import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { PostHogProvider } from 'posthog-js/react';
import { AuthProvider } from './auth/AuthContext';
import { NavBar } from './components/NavBar';
import { CookieBanner } from './components/CookieBanner';
import { HomePage } from './pages/HomePage';
import { AuditProgressPage } from './pages/AuditProgressPage';
import { AuditResultsPage } from './pages/AuditResultsPage';
import { LoginPage } from './pages/LoginPage';
import { MagicLinkVerifyPage } from './pages/MagicLinkVerifyPage';
import { MyAuditsPage } from './pages/MyAuditsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { posthog } from './analytics/posthog';

/**
 * Fires a PostHog `$pageview` on every SPA route change.
 * Must be rendered inside <BrowserRouter> so useLocation() works.
 */
function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    posthog.capture('$pageview', { $current_url: window.location.href });
  }, [location.pathname, location.search]);
  return null;
}

export default function App() {
  return (
    <PostHogProvider client={posthog}>
      <BrowserRouter>
        <AuthProvider>
          <PageViewTracker />
          <NavBar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/audits/:id/progress"
              element={<AuditProgressPage />}
            />
            <Route path="/audits/:id/results" element={<AuditResultsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/verify" element={<MagicLinkVerifyPage />} />
            <Route path="/my-audits" element={<MyAuditsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
          </Routes>
          <CookieBanner />
        </AuthProvider>
      </BrowserRouter>
    </PostHogProvider>
  );
}
