# AI Visibility Audit

> **Is your website invisible to AI?** Find out in 60 seconds — free. No signup required.

A free, open-source web tool that audits any website for **Generative Engine Optimisation (GEO)** readiness. It crawls up to 10 pages, runs 8 static signal analyzers, computes a **GEO Score out of 100**, and surfaces a prioritised list of actionable fixes.

Live at: **[aivisibilityaudit.cc](https://aivisibilityaudit.cc)**

---

## Table of Contents

- [Why it exists](#why-it-exists)
- [Features](#features)
- [GEO Score categories](#geo-score-categories)
- [Access tiers](#access-tiers)
- [Tech stack](#tech-stack)
- [Monorepo structure](#monorepo-structure)
- [Getting started (local)](#getting-started-local)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Database schema](#database-schema)
- [Background workers](#background-workers)
- [Deployment](#deployment)
- [CI / CD](#ci--cd)
- [Testing](#testing)

---

## Why it exists

AI chatbots (ChatGPT, Claude, Gemini) are replacing traditional search for high-intent queries. When someone asks _"What are the best cross-border payment platforms for African SMEs?"_ they read the AI-generated answer — not ten blue links. Companies that don't appear in those answers are effectively invisible to a growing segment of their audience.

Traditional SEO tools measure Google rank signals, not LLM readiness. This tool fills that gap.

---

## Features

- **Zero friction** — paste a URL, get results; no account required
- **8-category GEO scoring** — 100-point rubric covering entity clarity, content structure, schema markup, AI crawler access, brand authority, and more
- **Actionable recommendations** — every finding maps to a Critical / Medium / Low fix with optional code snippets
- **Email gate** — anonymous users see the top 3 critical issues; submitting an email unlocks the full list and sends a results link
- **Magic-link auth** — no passwords; returning users log in via email
- **Audit history** — registered users can track their score over time
- **Audit expiry** — results are stored for 7 days (anonymous) to motivate action; a reminder email is sent 24 h before expiry
- **Ko-fi donations** — fully free product; Ko-fi webhook awards donation points to supporters
- **Respects `robots.txt`** — mirrors how real AI crawlers behave

---

## GEO Score categories

| #   | Category               | Max pts | What it measures                                                                               |
| --- | ---------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| 1   | **Entity Definition**  | 15      | Homepage one-liner, problem/solution framing, target customer, Organization schema             |
| 2   | **Content Clarity**    | 15      | Plain-language summaries, bullet/numbered lists, FAQ sections, readability, term definitions   |
| 3   | **Topic Authority**    | 15      | Page count on core topic, blog content, internal links, content recency                        |
| 4   | **Semantic Structure** | 10      | Single H1, H2s as questions, paragraph length and segmentation                                 |
| 5   | **Structured Data**    | 10      | Organization, Product, Article, FAQ, HowTo schema types                                        |
| 6   | **AI Crawlability**    | 10      | `robots.txt` rules for GPTBot, ClaudeBot, PerplexityBot, Google-Extended; `llms.txt` presence  |
| 7   | **Brand Authority**    | 15      | Contact/address page, team page, press coverage, testimonials, external links, verified social |
| 8   | **AI Answerability**   | 10      | Server-side LLM call — standard prompt templates run against extracted content                 |
|     | **Total**              | **100** |                                                                                                |

---

## Access tiers

|                  | Anonymous      | Registered (email)                               |
| ---------------- | -------------- | ------------------------------------------------ |
| Audits           | 1 / month      | Up to `MONTHLY_AUDIT_LIMIT` / month (default: 3) |
| Recommendations  | Top 3 critical | Full list (all priorities + code snippets)       |
| Audit history    | —              | Yes (within retention window)                    |
| Result retention | 7 days         | 30 days                                          |
| Login            | Not required   | Magic link (no password)                         |

Rate limiting for anonymous users uses two independent Redis keys: one keyed by browser UUID (`anon_id`) and one by SHA-256-truncated IP address. Either key hitting its daily limit blocks the request.

---

## Tech stack

| Layer           | Technology                                                          |
| --------------- | ------------------------------------------------------------------- |
| Frontend        | React 19, Vite 6, TypeScript, React Router 7                        |
| Backend         | Fastify 5, TypeScript, Node.js                                      |
| Database        | PostgreSQL 17 (Kysely query builder)                                |
| Queue           | Redis 7, BullMQ                                                     |
| Crawler         | Firecrawl JS + custom `robots.txt` parser (`robots-parser`)         |
| Auth            | Magic link + JWT (`jose`) — `HttpOnly; Secure; SameSite=Lax` cookie |
| Email           | Resend                                                              |
| AI (Category 8) | OpenAI API                                                          |
| Donations       | Ko-fi webhook                                                       |
| Package manager | pnpm 9 (workspaces)                                                 |
| Hosting         | Railway (API + Web as separate services)                            |

---

## Monorepo structure

```
.
├── apps/
│   ├── api/                     # Fastify REST API + background workers
│   │   ├── migrations/          # Kysely DB migrations
│   │   │   ├── 2026_001_initial.ts
│   │   │   ├── 2026_002_users_auth_and_limits.ts
│   │   │   └── migrate.ts
│   │   └── src/
│   │       ├── analyzers/       # 8 signal analyzer modules (pure functions)
│   │       ├── auth/            # JWT helpers, magic-link token logic
│   │       ├── crawler/         # Web crawler + robots.txt handling
│   │       ├── db/              # Kysely queries (audits, users, emails)
│   │       ├── email/           # Resend email service
│   │       ├── middleware/      # Rate-limit middleware
│   │       ├── queue/           # BullMQ audit + expiry workers
│   │       ├── recommendations/ # Recommendation engine
│   │       ├── routes/          # Fastify route handlers
│   │       ├── scoring/         # GEO scoring engine
│   │       ├── types/           # Database type definitions
│   │       ├── utils/           # Date utilities
│   │       ├── db.ts            # Kysely DB client
│   │       ├── redis.ts         # ioredis client
│   │       ├── server.ts        # Fastify app factory
│   │       └── index.ts         # Entry point (server + worker startup)
│   └── web/                     # React + Vite frontend
│       └── src/
│           ├── api/             # API client
│           ├── design/          # Design system components
│           └── pages/           # HomePage, AuditProgressPage, AuditResultsPage
├── packages/
│   └── shared/                  # Shared TypeScript types (Audit, User, etc.)
├── .github/
│   └── workflows/
│       ├── ci.yml               # Lint + typecheck + test on push/PR
│       └── deploy.yml           # Deploy to Railway on main push
├── docker-compose.yml           # Local PostgreSQL + Redis
├── package.json                 # Root workspace (pnpm, Husky, lint-staged)
└── PRD.md                       # Product Requirements Document
```

---

## Getting started (local)

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 9+ (`npm i -g pnpm`)
- [Docker](https://www.docker.com/) (for local Postgres + Redis)

### 1. Clone and install

```bash
git clone https://github.com/<your-org>/ai-visibility-audit.git
cd ai-visibility-audit
pnpm install
```

### 2. Configure environment

```bash
cp .env.example apps/api/.env
```

Edit `apps/api/.env` — see [Environment variables](#environment-variables) for all options.

### 3. Start infrastructure

```bash
docker compose up -d
```

Starts PostgreSQL 17 on port `5432` and Redis 7 on port `6379`.

### 4. Run migrations

```bash
pnpm --filter '@repo/api' migrate
```

### 5. Start development servers

```bash
pnpm dev
```

Starts both the API (`http://localhost:3000`) and the web app (`http://localhost:5173`) in parallel.

---

## Environment variables

| Variable                  | Required | Default                           | Description                                                   |
| ------------------------- | -------- | --------------------------------- | ------------------------------------------------------------- |
| `DATABASE_URL`            | Yes      | —                                 | PostgreSQL connection string                                  |
| `REDIS_URL`               | Yes      | —                                 | Redis connection string                                       |
| `PORT`                    | No       | `3000`                            | API server port                                               |
| `JWT_SECRET`              | Yes      | `dev-secret-change-in-production` | Secret for signing JWT session cookies                        |
| `OPENAI_API_KEY`          | Yes      | —                                 | OpenAI API key (Category 8: AI Answerability)                 |
| `FIRECRAWL_API_KEY`       | Yes      | —                                 | Firecrawl API key for page crawling                           |
| `RESEND_API_KEY`          | No       | —                                 | Resend API key (emails disabled without it)                   |
| `WEB_BASE_URL`            | No       | `http://localhost:5173`           | Base URL for magic-link and results URLs in emails            |
| `KOFI_VERIFICATION_TOKEN` | No       | —                                 | Ko-fi webhook verification token                              |
| `MONTHLY_AUDIT_LIMIT`     | No       | `3`                               | Registered user monthly audit allowance                       |
| `LOG_LEVEL`               | No       | `info`                            | Fastify log level (`trace`, `debug`, `info`, `warn`, `error`) |

---

## API reference

All endpoints are served from `apps/api` (default: `http://localhost:3000`).

### Health

| Method | Path      | Description                                                                     |
| ------ | --------- | ------------------------------------------------------------------------------- |
| `GET`  | `/health` | Returns `{ status, db, redis }` — checks both PostgreSQL and Redis connectivity |

### Audits

| Method | Path          | Auth     | Description                                                                                                                                                         |
| ------ | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/audits`     | Optional | Submit a URL for auditing. Returns `{ auditId, status: "pending" }`. If a valid session cookie is present, the audit is linked to that user for extended retention. |
| `GET`  | `/audits/:id` | None     | Poll audit status and retrieve results. Returns `{ id, url, status, geoScore, categoryScores, findings, recommendations, expiresAt, createdAt }`.                   |

**`POST /audits` body:**

```json
{ "url": "https://example.com" }
```

**Audit statuses:** `pending` → `running` → `done` / `failed`

### Email gate

| Method | Path                | Auth | Description                                                                                                                                        |
| ------ | ------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/audits/:id/email` | None | Submit email to unlock full recommendations. Saves the email, sends a confirmation email with the results link, and returns `{ recommendations }`. |

**Body:** `{ "email": "user@example.com" }`

### Authentication

| Method | Path               | Auth     | Description                                                                        |
| ------ | ------------------ | -------- | ---------------------------------------------------------------------------------- |
| `POST` | `/auth/magic-link` | None     | Request a magic-link email. Upserts the user and sends a 15-minute login link.     |
| `GET`  | `/auth/verify`     | None     | Verify magic-link token (`?token=`). Issues a 7-day `HttpOnly` JWT session cookie. |
| `GET`  | `/auth/me`         | Required | Return current user details and monthly usage counters.                            |
| `POST` | `/auth/logout`     | Required | Clear the session cookie.                                                          |

### Webhooks

| Method | Path             | Description                                                                                                                        |
| ------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/webhooks/kofi` | Ko-fi donation webhook. Validates `verification_token`, awards donation points to the matching user account. Always returns `200`. |

---

## Database schema

Managed with Kysely migrations in `apps/api/migrations/`.

### `users`

| Column                  | Type           | Notes                                      |
| ----------------------- | -------------- | ------------------------------------------ |
| `id`                    | `uuid`         | PK, `gen_random_uuid()`                    |
| `email`                 | `varchar(255)` | Unique                                     |
| `magic_link_token_hash` | `varchar(64)`  | SHA-256 of the one-time token              |
| `magic_link_expires_at` | `timestamptz`  | Token TTL (15 minutes)                     |
| `audits_this_month`     | `integer`      | Resets lazily on first audit of new month  |
| `month_reset_at`        | `date`         | Date of last monthly reset                 |
| `donated`               | `boolean`      | Set to `true` on first Ko-fi donation      |
| `donation_points`       | `integer`      | Cumulative donation points                 |
| `plan`                  | `varchar(10)`  | `free` (dormant field for future Pro tier) |
| `created_at`            | `timestamptz`  |                                            |

### `audits`

| Column            | Type            | Notes                                                            |
| ----------------- | --------------- | ---------------------------------------------------------------- |
| `id`              | `uuid`          | PK, `gen_random_uuid()`                                          |
| `url`             | `varchar(2048)` |                                                                  |
| `status`          | `varchar(20)`   | `pending` / `running` / `done` / `failed`                        |
| `tier`            | `varchar(10)`   | `free`                                                           |
| `geo_score`       | `integer`       | 0–100                                                            |
| `category_scores` | `jsonb`         | Per-category breakdown                                           |
| `findings`        | `jsonb`         | Raw findings from all analyzers                                  |
| `recommendations` | `jsonb`         | Prioritised recommendation list                                  |
| `expires_at`      | `timestamptz`   | `+7 days` for anonymous audits; `+30 days` when `user_id` is set |
| `user_id`         | `uuid`          | FK → `users.id` (nullable, `ON DELETE SET NULL`)                 |
| `created_at`      | `timestamptz`   |                                                                  |

Index: `idx_audits_expires_at` on `expires_at` for efficient expiry queries.

### `audit_emails`

| Column       | Type           | Notes                                  |
| ------------ | -------------- | -------------------------------------- |
| `id`         | `uuid`         | PK                                     |
| `audit_id`   | `uuid`         | FK → `audits.id` (`ON DELETE CASCADE`) |
| `email`      | `varchar(255)` |                                        |
| `created_at` | `timestamptz`  |                                        |

### Running migrations

```bash
pnpm --filter '@repo/api' migrate
```

---

## Background workers

Both workers run in-process alongside the API server (started in `src/index.ts`) using BullMQ on Redis.

### Audit worker (`audit-jobs` queue)

Processes each audit job through the full pipeline:

```
crawl(url) → runAudit(crawlResult) → persistAuditResult → status: done
```

On any failure the audit is marked `failed`.

### Expiry worker (`expiry-jobs` queue)

A BullMQ repeatable job scheduled at **02:00 UTC daily**. Deletes all `audits` rows where `expires_at < now()`. Reminder emails are sent to affected users 24 hours before expiry.

---

## Deployment

The project deploys to [Railway](https://railway.app/) as two separate services from the same monorepo.

### API service (`apps/api/railway.toml`)

```toml
[build]
builder = "railpack"
buildCommand = "pnpm install --no-frozen-lockfile && pnpm --filter '@repo/api' build"

[deploy]
startCommand = "pnpm --filter '@repo/api' migrate && pnpm --filter '@repo/api' start"
```

Migrations run automatically on each deploy before the server starts.

### Web service (`apps/web/railway.toml`)

```toml
[build]
builder = "railpack"
buildCommand = "pnpm install --no-frozen-lockfile && pnpm --filter '@repo/web' build"

[deploy]
startCommand = "echo \"window.__ENV__ = { API_URL: '${API_URL}' };\" > apps/web/dist/env-config.js && npx serve -s apps/web/dist -l $PORT"
```

The `API_URL` Railway environment variable is injected at container start into `env-config.js`, making it available to the frontend at runtime without a rebuild.

### Required Railway services

- **PostgreSQL** plugin (provides `DATABASE_URL`)
- **Redis** plugin (provides `REDIS_URL`)

---

## CI / CD

### CI (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main`:

1. Install dependencies (`pnpm install --frozen-lockfile`)
2. Lint all packages (`pnpm --recursive --if-present lint`)
3. Typecheck all packages (`pnpm --recursive --if-present typecheck`)
4. Run API test suite (`pnpm --filter '@repo/api' test`)

### Deploy (`.github/workflows/deploy.yml`)

Runs on push to `main` — deploys API and web services **in parallel** via the Railway CLI:

```bash
railway up --service api --detach
railway up --service web --detach
```

Requires `RAILWAY_TOKEN` secret in GitHub repository settings.

---

## Testing

Tests live alongside source files in `apps/api/src/**/*.test.ts` and run with Vitest.

```bash
# Run all tests once
pnpm --filter '@repo/api' test

# Watch mode
pnpm --filter '@repo/api' test:watch
```

### What's tested

| Module                 | Strategy                                                   |
| ---------------------- | ---------------------------------------------------------- |
| All 8 signal analyzers | Unit tests with fixture HTML payloads                      |
| GEO Scoring Engine     | Unit tests — boundary values (all-zero → 0, all-max → 100) |
| Recommendation Engine  | Unit tests — fixture findings → correct priority ordering  |
| Audit worker           | Unit tests with injectable deps (crawl, runAudit mocks)    |
| Expiry worker          | Unit tests — asserts `deleteExpiredAudits` is called       |
| Auth (JWT, magic link) | Unit tests                                                 |
| Rate limiting          | Unit tests with mock Redis                                 |
| API routes             | Integration tests (`audits`, `auth`, `email`, `kofi`)      |

---

## Design system

| Element         | Value                                       |
| --------------- | ------------------------------------------- |
| Primary         | `#4A2574` (deep purple)                     |
| Secondary       | `#9E72C3` (soft purple)                     |
| Background      | `#000000` / `#FFFFFF`                       |
| Accent gradient | `linear-gradient(135deg, #4A2574, #9E72C3)` |
| Body font       | Inter                                       |
| Display font    | Syne / Plus Jakarta Sans                    |
| Style           | Dark-mode-first, clean, minimal             |

---

## Contributing

1. Fork the repo and create a feature branch
2. Run `pnpm install` and `docker compose up -d`
3. Copy `.env.example` to `apps/api/.env` and fill in your keys
4. Run migrations: `pnpm --filter '@repo/api' migrate`
5. Make changes — tests must pass: `pnpm --filter '@repo/api' test`
6. CI will lint, typecheck, and test automatically on PR

---

## Monetisation

This is a **fully free product**. There are no paid plans. Monetisation is donation-based via [Ko-fi](https://ko-fi.com). Donations award points to supporter accounts and may unlock reward features in future.
