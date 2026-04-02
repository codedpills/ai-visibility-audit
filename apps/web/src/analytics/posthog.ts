import posthog from 'posthog-js';

const token = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host =
  import.meta.env.VITE_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

if (token && typeof window !== 'undefined') {
  posthog.init(token, {
    api_host: host,
    // Disable automatic pageview capture — we track SPA navigations manually
    // via the PageViewTracker component in App.tsx so every route change is
    // recorded correctly with the right URL.
    capture_pageview: false,
    persistence: 'localStorage',
    // GDPR: opt out by default until the user gives consent via the cookie
    // banner. CookieBanner calls posthog.opt_in_capturing() on accept and
    // posthog.opt_out_capturing() on decline.
    opt_out_capturing_by_default: true,
  });
}

export { posthog };
