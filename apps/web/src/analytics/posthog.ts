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
  });
}

export { posthog };
