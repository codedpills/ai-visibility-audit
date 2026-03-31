# PRD: AI Visibility Audit Tool

> **Product name:** AI Visibility Audit
> **Domain:** aivisibilityaudit.cc
> **Date:** March 2026

---

## Problem Statement

AI chatbots (ChatGPT, Claude, Gemini) are replacing traditional search for high-intent queries. When a user asks _"What are the best cross-border payment platforms for African SMEs?"_, they read the AI-generated answer — not ten blue links. Companies that do not appear in those answers are effectively invisible to a growing segment of their target audience.

Today no dedicated tool exists to measure or improve a company's AI search visibility. Traditional SEO tools (Ahrefs, SEMrush) measure Google rank signals, not LLM readiness. Marketers and founders have no way to discover whether their site is being cited by AI systems, or why it isn't.

---

## Solution

**AI Visibility Audit** is a free web-based audit tool that:

1. Accepts a company URL and crawls up to 10 pages
2. Runs a multi-signal static analysis across 8 LLM-readiness categories producing a **GEO Score out of 100**
3. Produces a **GEO Score (0–100)** representing overall AI visibility readiness
4. Surfaces a prioritised list of actionable fixes (Critical / Medium / Low) with code snippets
5. Is **completely free** — no payment required, ever

**Access tiers:**

- **Anonymous** — 1 audit/month (identified by IP + browser token); sees score, top 3 recommendations
- **Registered (email)** — up to 3 audits/month (configurable), full recommendations, audit history, magic-link login

**Monetisation:** Donation-based via Ko-fi. Users who donate are thanked and awarded points. Points may unlock reward features in future.

**Data retention:** Audit results are stored for **7 days** for anonymous users and **30 days** for registered users. Users are informed at multiple touchpoints: the results page, the confirmation email, and a reminder email 1 day before expiry.

---

## Target Users

### Primary: Startup Founders

Founders who want their product to appear in AI-generated answers (fintech, SaaS, marketplaces, developer tools).

### Secondary

Marketing teams, SEO specialists, growth teams, agencies, product marketers.

---

## User Stories

### Audit initiation

1. As a startup founder, I want to enter my company URL and start an audit without creating an account, so that I can immediately understand my AI visibility.
2. As a user, I want to see a progress indicator while the audit is running, so that I know the tool is working and roughly how long it will take.
3. As a user, I want the audit to crawl up to 10 pages of my site automatically, so that I don't have to manually submit individual URLs.
4. As a user, I want the crawler to respect my `robots.txt` file, so that I know the tool behaves ethically and mirrors how real AI crawlers behave.

### Results — free tier

5. As a free user, I want to see my overall GEO score (0–100) immediately after the audit, so that I can gauge my baseline AI visibility at a glance.
6. As a free user, I want to see a score breakdown across each signal category, so that I understand which areas are strongest and weakest.
7. As a free user, I want to see the top 3 most critical issues found, so that I know where to focus first without needing to pay.
8. As a user, I want to enter my email to unlock the complete list of findings, so that I can access all recommendations while the product grows its user base.
9. As a user, I want to receive the audit results link by email, so that I can revisit the report later.
10. As a free user, I want to be clearly informed that my audit results will be deleted after 7 days, so that I know to either save key findings or upgrade before that period ends.
11. As a free user, I want to receive an email reminder before my results expire, so that I have a chance to act on them or upgrade before they are deleted.

### Results — registered users

12. As a registered user, I want to see my full recommendations list with all priority levels and code snippets.
13. As a registered user, I want a dashboard showing my past audits (within 7 days), so I can track progress over time.
14. As a registered user, I want to see how many audits I have left this month and when my allowance resets, so I can plan accordingly.

### Scoring & signals

20. As a user, I want my GEO score to reflect how clearly my site defines who I am and what I do (Entity Definition).
21. As a user, I want my score to reflect whether an LLM can easily extract clear, quotable answers from my site (Content Clarity).
22. As a user, I want my score to reflect the depth and breadth of content on my core topic (Topic Authority).
23. As a user, I want my score to reflect how well my content is structured for LLM parsing — headings, questions, paragraph length (Semantic Structure).
24. As a user, I want my score to reflect which schema.org types are present and valid on my site (Structured Data).
25. As a user, I want my score to reflect whether known AI crawlers are allowed by my `robots.txt`, and whether an `llms.txt` file is present (AI Crawlability).
26. As a user, I want my score to reflect brand authority signals detectable from crawling — team page, press coverage, testimonials, social links (Brand Authority).
27. As a user, I want my score to reflect whether my content contains answers to the most common AI queries about my brand — scored by running standard prompt templates against extracted content (AI Answerability).
28. As a Pro user, I want my score to additionally incorporate a live LLM mention rate from real queries to GPT/Claude/Gemini.
29. As a user, I want each score category explained in plain English, so that I understand what it means and why it matters.
30. As a user, I want every recommendation labelled Critical / Medium / Low, so that I know what to fix first.

### Accounts & access

31. As an anonymous user, I want to start an audit without creating an account, so I can evaluate the tool immediately.
32. As a user, I want to provide my email to unlock full recommendations and register my account in a single action.
33. As a registered user, I want to receive a magic link by email to log in on subsequent visits, so I don't need a password.
34. As a registered user, I want to see a counter of audits used this month and when it resets.
35. As a user, I want to donate to support the tool via Ko-fi, so I can contribute if I find it valuable.

### Rate limits

36. As a registered user, I want to be clearly shown the monthly audit limit before I start, so I don't use it up unintentionally.
37. When I reach my anonymous daily limit, I want to be prompted to register with my email to continue.
38. When I reach my monthly limit as a registered user, I want to see clearly when it resets.

---

## Implementation Decisions

### Tech stack

- **Frontend:** React + Vite + TypeScript (Vite SSG for homepage pre-render)
- **Backend:** Node.js + Fastify + TypeScript
- **Database:** PostgreSQL (audit results + user data)
- **Queue:** Redis (async audit jobs + rate limit counters)
- **Email:** Resend (transactional emails — magic links + results confirmations)
- **Auth:** Magic link (email) + JWT session cookie; no passwords
- **Donations:** Ko-fi (no platform fee); webhook records donor flag + points in DB
- **Payments:** None (fully free product)

### Modules

**1. Web Crawler**
Accepts a root URL. Discovers internal links and crawls up to 10 pages. Returns structured payloads per page: HTML body, `<head>` metadata, HTTP response headers, response time. Respects `robots.txt` disallow rules and crawl-delay.

**2. Signal Analyzers (8 categories)**
Stateless functions: input = crawled page payloads, output = category score (0–max pts) + array of `Finding` objects. One analyzer per category. Each is independently testable in isolation.

| #   | Category           | Max pts | Implementation                                                                                                                                                                                               |
| --- | ------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Entity Definition  | 15      | Crawl: homepage one-liner, problem/solution framing, target customer, org schema                                                                                                                             |
| 2   | Content Clarity    | 15      | Crawl: plain-language summaries, bullet/numbered lists, FAQ section, readability score, term definitions                                                                                                     |
| 3   | Topic Authority    | 15      | Crawl: page count on core topic, blog content, internal links, content recency                                                                                                                               |
| 4   | Semantic Structure | 10      | Crawl: single H1, H2s as questions, paragraph length and segmentation                                                                                                                                        |
| 5   | Structured Data    | 10      | Crawl: Organization, Product, Article, FAQ, HowTo schema — 2 pts each                                                                                                                                        |
| 6   | AI Crawlability    | 10      | Crawl: robots.txt checks for GPTBot (3), ClaudeBot (3), PerplexityBot (2), Google-Extended (2); `llms.txt` presence as bonus signal                                                                          |
| 7   | Brand Authority    | 15      | Crawl: contact/address page, team/founders page, press page, case studies/testimonials, external links to recognized domains, verified social links                                                          |
| 8   | AI Answerability   | 10      | Server-side LLM call: standard prompt templates run against extracted site content — "What is X?", "What problem does X solve?", "Who is X for?", "How does X work?", "What makes X different?" (2 pts each) |

**3. GEO Scoring Engine**
Consumes all 8 analyzer outputs. Sums raw points to produce the GEO Score (0–100). Returns overall score + per-category sub-scores. Category weights are a direct point allocation (no separate weighting config needed). For Pro users, live LLM mention rate adds up to 5 bonus points (score capped at 100).

**4. Recommendation Engine**
Maps `Finding` objects from all analyzers to human-readable `Recommendation` objects with priority (Critical / Medium / Low) and optional code snippet. Returns a sorted list.

**5. Live LLM Query Module (Pro)**
Accepts a domain name and a set of generated industry-relevant prompts. Calls GPT-4o, Claude 3, and Gemini Pro APIs. Parses responses for brand/domain mentions. Returns mention rate + raw prompt-response pairs. Rate-limited and cost-gated to Pro users.

**6. Email Gate Service**
Captures email before exposing full results. Associates email with audit result ID. Triggers transactional email with results link (via Resend). Also sends a reminder email 1 day before 7-day expiry for free-tier audits.

**7. Audit Retention & Expiry Service**
Stores audit results with a `tier` field (`free` / `pro`) and an `expires_at` timestamp (7 days from creation for free-tier; `null` for Pro). A scheduled job runs daily to delete expired free-tier records. Expiry date surfaced in UI and emails.

**8. PDF Generator**
Accepts a full audit result object and renders it into a branded PDF (server-side PDF library). Accessible to Pro users only, generated on demand. Branded with domain name and audit date.

**9. Auth & User Service**
Registration, login (email/password or magic link), session management, and plan enforcement (free / pro). JWT-based auth. Integrates with Stripe for Pro gating.

**10. Audit Storage & History**
Persists audit results to PostgreSQL. Pro results linked to user account for historical tracking. Free results expire per retention policy.

**11. Fastify REST API**
| Method | Path | Description |
|--------|------|-------------|
| POST | `/audits` | Submit URL, return job ID |
| GET | `/audits/:id` | Poll status + retrieve results |
| POST | `/audits/:id/email` | Submit email to unlock full results |
| POST | `/audits/:id/pdf` | Generate + return PDF (Pro only) |
| GET | `/users/:id/audits` | Audit history (Pro only) |
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Authenticate |
| POST | `/auth/logout` | End session |

**12. React + Vite + TypeScript Frontend**
Pages: Landing, Audit progress, Results dashboard (free + gated Pro views), PDF download, Pricing/upgrade, Account settings, Audit history (Pro).

---

## Visual Design System

| Element          | Spec                                               |
| ---------------- | -------------------------------------------------- |
| Primary colour   | `#4A2574` (deep purple)                            |
| Secondary colour | `#9E72C3` (soft purple)                            |
| Background       | `#000000` (black) / `#FFFFFF` (white)              |
| Accent           | `linear-gradient(135deg, #4A2574, #9E72C3)`        |
| Body font        | **Inter** (Google Fonts)                           |
| Display font     | **Syne** or **Plus Jakarta Sans**                  |
| Illustrations    | Undraw / Storyset — purple-tinted to match palette |
| Style            | Clean, minimal, dark mode primary                  |

### Homepage layout

- Full-bleed dark hero section
- Bold H1: _"Is your website invisible to AI?"_
- Subheading: _"Find out in 60 seconds — free. No signup required."_
- URL input + **"Run Free Audit →"** CTA (prominent, purple gradient)
- Undraw/Storyset illustration — friendly robot or AI/search visual
- Social proof strip: _"Trusted by X founders"_ (placeholder at launch)
- Below fold: How it works (3 steps), what you get, pricing teaser

---

## Testing Decisions

A good test verifies observable behaviour from the outside — it checks what a module returns for a given input, not how it achieves it internally.

**Modules to test:**

- **Signal Analyzers (all 8)** — unit tested with fixture HTML/file payloads. Each is a pure function (input: page data → output: category score + findings); trivially testable in isolation.
- **GEO Scoring Engine** — unit tested with mock analyzer outputs. Verify point summation and boundary values (all zeros → 0, all maxes → 100). Verify Pro bonus points are capped at 100.
- **Recommendation Engine** — unit tested. Given known findings, assert correct recommendation objects and priority ordering.
- **Audit Retention Service** — unit tested. Assert `expires_at` set correctly for free-tier; expiry job deletes only expired free records, not Pro records.
- **Fastify API** — integration tested against a test database. Assert correct HTTP responses, auth enforcement, plan gating, and expiry behaviour.
- **Live LLM Query Module** — tested with mocked API clients. Assert mention/no-mention parsing from fixture response strings.

---

## Out of Scope

- Competitor comparison / benchmarking
- Annotated page-by-page findings in PDF
- Bulk domain auditing
- Browser extension
- Webhook notifications
- Third-party API access
- White-label / agency multi-client dashboards
- Automated fix deployment

---

## Further Notes

- **Product name** is a working title. Final branding TBD.
- **`llms.txt`** is an emerging convention; its scoring weight should be adjusted as adoption matures.
- **Live LLM query costs** need a per-audit cost model before launch to prevent margin erosion on Pro plans.
- **7-day expiry** surfaced at: results page banner, confirmation email, and reminder email (1 day before expiry).
