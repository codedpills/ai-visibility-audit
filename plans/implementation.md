# Plan: AI Visibility Audit Tool

> Source PRD: [PRD.md](../PRD.md)

## Architectural decisions

Durable decisions that apply across all phases:

- **Monorepo layout:** `apps/web` (React + Vite + TypeScript), `apps/api` (Fastify + TypeScript), `packages/shared` (shared types)
- **Business model:** Fully free. Monetisation via Ko-fi donations only.
- **Access tiers:**
  - Anonymous — 1 audit/month (IP SHA-256 + browser UUID token, two independent Redis keys)
  - Registered — up to `MONTHLY_AUDIT_LIMIT` audits/month (env var, default 3), magic-link login, audit history
- **Routes:**
  - `POST /audits` — submit URL, return `{ auditId }`
  - `GET /audits/:id` — poll status + results
  - `POST /audits/:id/email` — submit email, unlock full results, upsert user, send magic link
  - `GET /users/me/audits` — audit history for authenticated user
  - `POST /auth/magic-link` — send magic link email
  - `GET /auth/verify` — validate token, issue JWT session cookie
  - `GET /auth/me` — return current user + usage counters
  - `POST /auth/logout` — clear session cookie
  - `POST /webhooks/kofi` — Ko-fi donation webhook
- **Schema (PostgreSQL):**
  - `audits` — `id`, `url`, `status`, `tier`, `geo_score`, `category_scores` (JSONB), `findings` (JSONB), `recommendations` (JSONB), `expires_at`, `user_id` (nullable), `created_at`
  - `users` — `id`, `email`, `magic_link_token_hash`, `magic_link_expires_at`, `audits_this_month`, `month_reset_at`, `donated`, `donation_points`, `plan` (dormant), `created_at`
  - `audit_emails` — `audit_id`, `email`, `created_at`
- **Auth:** Magic link only. JWT issued as `HttpOnly; Secure; SameSite=Lax` cookie on verify. 7-day expiry. Secret from `JWT_SECRET` env var.
- **Rate limiting:** Anonymous checked via two Redis keys (IP hash + browser UUID). Registered checked via `users.audits_this_month` with lazy monthly reset.
- **Queue:** BullMQ on Redis — `audit-jobs` queue; worker runs crawl + analysis pipeline
- **AI Answerability (Category 8):** server-side LLM call (OpenAI API) against extracted site content
- **Email:** Resend SDK; `FROM_EMAIL` env var; magic link + results confirmation + expiry reminder
- **Donations:** Ko-fi webhook; `KOFI_VERIFICATION_TOKEN` env var; stores `donated=true` + `donation_points` on user
- **SEO/GEO:** Vite SSG pre-renders `/` only; structured data (JSON-LD); `llms.txt`, `robots.txt`, `sitemap.xml`, `ai.txt` in `public/`

---

## Phase 1: Monorepo scaffold

**User stories:** —

### What to build

Set up the full project skeleton so every subsequent phase has a working, typed, linted foundation to build on. No business logic yet — just infrastructure running end-to-end.

- Monorepo root with a package manager workspace (`pnpm` workspaces)
- `apps/api` — Fastify server boots, responds to `GET /health`, connects to PostgreSQL and Redis
- `apps/web` — Vite + React app boots, renders a placeholder homepage
- `packages/shared` — shared TypeScript types package, importable from both apps
- Database migrations tooling in place (e.g. `node-pg-migrate` or `kysely` migrations); initial empty migration runs successfully
- ESLint + TypeScript strict mode configured across all packages
- `docker-compose.yml` for local PostgreSQL + Redis

### Acceptance criteria

- [ ] `pnpm install` from repo root installs all dependencies
- [ ] `docker-compose up` starts PostgreSQL and Redis locally
- [ ] `pnpm dev` (or equivalent in each app) starts both apps without errors
- [ ] `GET /health` on the API returns `200 OK`
- [ ] `packages/shared` types can be imported in both `apps/api` and `apps/web` without TypeScript errors
- [ ] Database migration runs cleanly against the local PostgreSQL instance
- [ ] ESLint passes with zero errors across all packages

---

## Phase 2: Crawl → score → results (core loop)

**User stories:** 1, 2, 3, 4, 5, 6, 20–29

### What to build

The first demoable vertical slice: a user enters a URL, the backend crawls up to 10 pages, runs all 8 static signal analyzers, computes the GEO score, and the frontend displays the score and per-category breakdown.

Category 8 (AI Answerability) uses a server-side LLM call against extracted content — no external LLM queries. The results page shows the overall score and category scores to all users at this stage (email gate comes in Phase 3).

**Backend:**

- `POST /audits` enqueues a BullMQ job, returns `{ auditId, status: "pending" }`
- Worker: Web Crawler → 8 Signal Analyzers → GEO Scoring Engine → persist result
- `GET /audits/:id` returns current status and, when done, the full result payload
- All 8 category schemas and point allocations match the PRD scoring model exactly

**Frontend:**

- Landing page: URL input + "Run Free Audit →" CTA (design system applied: dark mode, Inter/Syne fonts, `#4A2574` palette)
- Audit progress page: polls `GET /audits/:id`, shows live status
- Results page: overall GEO score (large, prominent), per-category score breakdown with plain-English explanations

### Acceptance criteria

- [ ] Submitting a valid URL via the frontend triggers an audit job
- [ ] Progress page polls and updates in real time until audit completes
- [ ] All 8 category scores are calculated and stored correctly
- [ ] GEO score (sum of category scores) is correct for known fixture inputs
- [ ] Results page renders score and all 8 categories with labels and descriptions
- [ ] Crawler respects `robots.txt` disallow rules
- [ ] Unit tests pass for all 8 signal analyzers with HTML fixture inputs
- [ ] Unit tests pass for the GEO Scoring Engine (boundary values: 0 and 100)

---

## Phase 3: Recommendation engine + email gate + audit expiry

**User stories:** 7, 8, 9, 10, 11, 31, 32

### What to build

Surface actionable recommendations from findings, gate the full list behind an email, enforce 7-day expiry for free-tier audits, and send transactional emails.

**Backend:**

- Recommendation Engine: maps `Finding` objects from all analyzers to prioritised `Recommendation` objects (Critical / Medium / Low) with optional code snippets; runs as part of the audit pipeline
- `POST /audits/:id/email` — saves email, marks audit as email-unlocked, triggers confirmation email (results link) via Resend
- `expires_at` set to `now + 7 days` for all audits at creation (will be extended to `null` for Pro in Phase 5)
- Daily scheduled job (BullMQ `cron`) deletes expired free-tier audit records
- Expiry reminder email sent 24 hours before `expires_at`

**Frontend:**

- Results page: free view shows top 3 critical recommendations only
- Email gate component: prompt to enter email to unlock full list of recommendations
- After email submitted: full recommendations list revealed with priority labels and code snippets
- Expiry banner on results page showing days remaining
- Confirmation email content: results link + expiry date + upgrade CTA

### Acceptance criteria

- [ ] Recommendation Engine produces a sorted list (Critical first) from known fixture findings
- [ ] `POST /audits/:id/email` saves email and returns the full recommendation list
- [ ] Free results page shows exactly 3 recommendations before email is submitted
- [ ] Full recommendations (all priorities) shown after email submission
- [ ] Each recommendation has a priority label; code snippets render correctly where present
- [ ] Confirmation email is sent with correct results link and expiry date
- [ ] `expires_at` is set to 7 days from creation for every new audit
- [ ] Expiry job deletes only records where `expires_at < now` and `tier = 'free'`
- [ ] Reminder email is sent ~24 hours before expiry
- [ ] Unit tests pass for Recommendation Engine priority ordering and snippet attachment

---

## Phase 4: Auth + Pro accounts + Stripe billing

**User stories:** 33, 34

### What to build

User registration/login, JWT session management, Pro plan enforcement via Stripe, and `expires_at = null` for Pro audits.

**Backend:**

- `POST /auth/register` — create user, return JWT
- `POST /auth/login` — verify credentials, return JWT
- `POST /auth/logout` — invalidate session
- Stripe Checkout session created server-side; webhook updates `users.plan` to `pro` on successful payment
- Audits created by an authenticated Pro user have `tier = 'pro'` and `expires_at = null`
- `POST /audits/:id/pdf` and `GET /users/:id/audits` return `403` for non-Pro users

**Frontend:**

- Register / Login pages
- Pricing page with Free vs Pro comparison and Stripe Checkout CTA
- Account settings page: plan status, billing portal link (Stripe Customer Portal)
- Authenticated audit submissions link the audit to the user account

### Acceptance criteria

- [ ] User can register, log in, and receive a JWT
- [ ] Authenticated requests to protected routes succeed; unauthenticated requests return `401`
- [ ] Stripe Checkout flow completes and updates user plan to `pro` in the database
- [ ] Pro user audits have `tier = 'pro'` and `expires_at = null`
- [ ] Non-Pro requests to PDF and history endpoints return `403`
- [ ] Billing portal link opens Stripe Customer Portal
- [ ] Integration tests cover auth endpoints and plan enforcement middleware

---

## Phase 5: PDF report (Pro)

**User stories:** 12, 13, 14, 15, 16

### What to build

On-demand PDF generation for Pro users. The PDF is branded, includes all required sections, and is streamed directly to the user.

**Backend:**

- `POST /audits/:id/pdf` — Pro-gated; renders audit result into a PDF and streams it as `application/pdf`
- PDF contents: branded cover (domain + audit date), executive summary + overall GEO score, per-category score breakdown, prioritised recommendations table (Critical / Medium / Low), "fix this" code snippets

**Frontend:**

- "Download PDF Report" button on results page, visible and active for Pro users
- Loading state while PDF is being generated

### Acceptance criteria

- [ ] Pro user can click "Download PDF Report" and receive a valid PDF file
- [ ] PDF contains: branded cover, exec summary, GEO score, all 8 category scores, full recommendations with priorities, code snippets
- [ ] Non-Pro users see the button disabled/locked with an upgrade prompt
- [ ] PDF filename includes the audited domain and date

---

## Phase 6: Audit history (Pro)

**User stories:** 17

### What to build

Pro users can view a timeline of all past audits for their account, showing GEO score progression over time.

**Backend:**

- `GET /users/:id/audits` returns all audits linked to the user, ordered by `created_at` desc, with `geo_score`, `created_at`, and `url`

**Frontend:**

- Audit history page: list/timeline of past audits, each showing domain, date, GEO score, and a link to the full results
- Score trend chart (simple line chart) if 2+ audits exist for the same domain

### Acceptance criteria

- [ ] Pro user's past audits are listed in reverse chronological order
- [ ] Each entry shows domain, date, and GEO score
- [ ] Score trend chart renders when 2+ audits exist for the same domain
- [ ] Non-Pro users are redirected to the pricing page if they access the history route

---

## Phase 7: Live LLM query module (Pro)

**User stories:** 18, 19, 28

### What to build

Pro users can trigger live queries to GPT-4o, Claude 3, and Gemini Pro to measure real-world brand mention rate. Results add up to 5 bonus points to the GEO score (capped at 100) and are displayed alongside the static score.

**Backend:**

- Live LLM Query Module: generates industry-relevant prompts from crawled content, sends to all 3 APIs, parses responses for domain/brand mentions, returns mention rate + prompt-response pairs
- Called as an optional additional step after the static audit pipeline completes (Pro users only); result stored in `audits.live_llm_result` (JSONB)
- Bonus points added to GEO score on retrieval, not re-stored (score cap enforced at 100)
- Per-audit API cost tracked in `audits.llm_cost_usd` for margin monitoring

**Frontend:**

- Results page (Pro): "Live AI Visibility" section showing mention rate across GPT/Claude/Gemini
- Prompt-response pairs shown in expandable rows (which prompts triggered mentions, which didn't)
- Score tooltip explains the bonus points component

### Acceptance criteria

- [ ] Live LLM queries are only triggered for Pro users
- [ ] Mention/no-mention parsing is correct for fixture response strings (mocked API clients in tests)
- [ ] Mention rate and prompt-response pairs are stored and displayed correctly
- [ ] Bonus points are applied to GEO score, capped at 100
- [ ] `llm_cost_usd` is recorded per audit
- [ ] Non-Pro users see a locked "Live AI Visibility" section with upgrade CTA
