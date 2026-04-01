# Product Hunt Launch Campaign — AI Visibility Audit

> Use this file as your copy-paste resource for launch day. Every section maps to a field or touchpoint on Product Hunt.

---

## 1. Product Listing Basics

### Name

```
AI Visibility Audit
```

### Tagline

**(140 chars max — pick one or A/B test in comments)**

**Option A (problem-first):**

```
Is your website invisible to AI? Find out in 60 seconds — free, no signup required.
```

**Option B (contrast with SEO tools):**

```
Traditional SEO tools measure Google rank. This measures LLM readiness. Free & open source.
```

**Option C (short & punchy):**

```
Free GEO audit: see how visible your site is to ChatGPT, Claude & Gemini in 60 seconds.
```

> **Recommendation:** Go with Option A — it leads with the pain, creates instant curiosity, and the "60 seconds" + "free" remove two common objections upfront.

### Website URL

```
https://aivisibilityaudit.cc
```

### GitHub URL (for open-source badge)

```
https://github.com/codedpills/ai-visibility-audit
```

### Topics / Category

```
Developer Tools, SEO, Artificial Intelligence, Marketing, Open Source
```

---

## 2. Maker Comment (Post on Launch Day — First Comment)

_This is the most important piece of copy. It shows up first and sets the tone. Write it as a personal message, not marketing speak._

---

Hey Product Hunt! 👋

I'm the maker of **AI Visibility Audit** — a free, open-source tool that tells you whether your website is visible to AI language models like ChatGPT, Claude, and Gemini.

**Why I built this:**
I kept noticing that when I asked ChatGPT about tools in specific niches, the same brands kept surfacing — and they weren't necessarily the best; they were just the ones whose sites were structured in ways AI could understand and quote. Meanwhile, genuinely great products were invisible.

Traditional SEO tools (Ahrefs, SEMrush) are brilliant for Google rankings, but they measure the wrong signals for AI search. There was no dedicated tool to answer: _"Is my site the kind of place AI will cite?"_ — so I built one.

**What it does:**
Paste any URL → we crawl up to 10 pages and analyse 8 GEO (Generative Engine Optimisation) signals:

1. **Entity Definition** — Does your site clearly say who you are and what you do?
2. **Content Clarity** — Is your content structured in formats AI prefers (FAQs, bullets, summaries)?
3. **Topic Authority** — Does your site demonstrate depth on its subject?
4. **Brand Authority** — Do external signals (press, mentions, social) help AI trust you?
5. **Semantic Structure** — Is your HTML organised in a way crawlers can parse?
6. **Structured Data** — Do you have JSON-LD schema that explicitly labels your content?
7. **AI Crawlability** — Does your robots.txt actually allow GPTBot, ClaudeBot, PerplexityBot in?
8. **AI Answerability** — Can an AI answer common questions about you _using only your content_?

You get a score out of 100 with a letter grade (A–F), a per-category breakdown, and prioritised recommendations with copy-pasteable code examples.

**It's completely free.** No paid tier. Donation-supported via Ko-fi. The code is on GitHub.

Would love your feedback — bug reports and feature requests go straight to GitHub Issues from the footer of the site.

🚀 [aivisibilityaudit.cc](https://aivisibilityaudit.cc)

---

## 3. Product Description (About section on PH listing)

```
AI Visibility Audit is a free, open-source GEO (Generative Engine Optimisation) tool
that tells you how visible your website is to AI language models — ChatGPT, Claude,
Gemini, and Perplexity.

As AI-powered search replaces blue links for high-intent queries, companies that don't
appear in AI-generated answers are effectively invisible to a growing segment of their
audience. Traditional SEO tools measure Google rank signals — not LLM readiness.

AI Visibility Audit fills that gap.

Paste any URL. In 60 seconds you get:

• A GEO score out of 100 (graded A–F)
• Breakdown across 8 GEO signal categories
• Prioritised recommendations with copy-pasteable code examples
• A downloadable PDF report (for logged-in users)

No signup required to run your first audit.

— 100% free, no paid tier
— Open source (MIT)
— No account needed for basic use
— Magic-link auth (no passwords)
— Donation-supported via Ko-fi
```

---

## 4. Gallery / Screenshots — What to Capture

Prepare these before launch day. Order matters — PH shows the first image as the thumbnail.

| #   | Screenshot                           | What to show                                                                                                                                                                  |
| --- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Hero / Score card**                | A real audit result showing the score ring, grade (e.g. "C — 58/100"), and category breakdown. Pick a well-known site that scores in the C/D range to make the value obvious. |
| 2   | **Category breakdown**               | Close-up of the 8 accordion categories with scores, all expanded to show the descriptions and "Detected on your site" findings.                                               |
| 3   | **Recommendations**                  | A few recommendation cards showing priority badge (critical/medium/low), title, description, and an expanded code snippet.                                                    |
| 4   | **Email gate → Inbox → Full report** | Three-panel flow: the "Unlock Full Report" CTA → the "Check your inbox" confirmation → the full recommendations page logged in.                                               |
| 5   | **PDF preview**                      | Show the browser print preview with everything expanded.                                                                                                                      |
| 6   | **Homepage / Audit form**            | The clean landing page — just the URL form, signal chips, and the "Is your website invisible to AI?" headline.                                                                |

> **Tip:** Use a real, recognisable domain for demo screenshots (e.g. a popular open-source project or a well-known startup). A score in the 40–65 range is ideal — it's realistic and shows the most actionable output.

---

## 5. Video / GIF (Highly recommended on PH)

A short screen recording (30–60 seconds) outperforms any static screenshot on PH.

**Script:**

1. Start on the homepage. Type a URL into the form — `stripe.com` or similar well-known brand.
2. Click "Run Free Audit →" — show the "Crawling..." state.
3. Cut to results (or speed-ramp the wait). Score ring animates in — show the grade.
4. Scroll through the category breakdown with accordions open.
5. Highlight one "critical" recommendation and expand the code snippet.
6. Show the "Unlock Full Report" → email form → "Check your inbox" state.
7. End on the homepage tagline.

**Tools:** Loom (free), ScreenToGif, or QuickTime + Gifox. No voiceover needed — on-screen text is enough.

---

## 6. Discussion / Comment Responses (Pre-written Templates)

Use these as starting points for answering common PH questions quickly on launch day.

### "How is this different from [X SEO tool]?"

> Great question! Ahrefs and SEMrush are excellent at measuring Google-specific signals — backlinks, keyword rankings, technical SEO. AI Visibility Audit measures something orthogonal: whether your content is structured, labelled, and written in a way that LLMs can extract, understand, and cite. The signals are different (JSON-LD schema, robots.txt AI crawlers, FAQ-style content, entity definition) and so is the output (a GEO score, not keyword rankings). They're complementary tools.

### "Is the score reliable?"

> The 8 categories are based on publicly available research from Google, Anthropic, and academic papers on Generative Engine Optimisation, plus analysis of which site patterns correlate with AI citations. Category 8 (AI Answerability) actually sends 5 prompt variants to an OpenAI model to see if it can answer questions about your site from your content alone. No scoring system is perfect, but it gives you an actionable baseline and a clear list of what to fix.

### "Why free? What's the catch?"

> No catch — it's a donation-supported open-source project. The code is on GitHub. I pay for hosting out of pocket + Ko-fi donations. If it helps you, consider buying me a coffee. If not, that's fine too.

### "Can I self-host it?"

> Yes! It's a standard Node/React monorepo. Instructions are in the README. You'll need PostgreSQL, Redis, a Resend API key (for magic-link emails), and an OpenAI key (for Category 8). PRs welcome.

### "What about [specific missing feature]?"

> That's a great idea — would you mind filing it as a feature request on GitHub? There's a link in the footer of the site. It goes straight into the issue tracker with a structured template.

---

## 7. Launch Day Checklist

### Before launch (day before)

- [ ] Screenshot set captured (see Section 4)
- [ ] Video/GIF recorded and trimmed
- [ ] Maker comment drafted and ready to paste (Section 2)
- [ ] Tags: `Developer Tools`, `SEO`, `Artificial Intelligence`, `Open Source`, `Marketing`
- [ ] Railway env var `ANON_MONTHLY_LIMIT` set (controls free-tier rate limit)
- [ ] Test a full audit flow end-to-end on production
- [ ] Ko-fi link working and visible on the site

### Launch day (12:01 AM PT is the PH reset — that's when to post)

- [ ] Submit the listing at midnight Pacific (gives you the full 24-hour cycle)
- [ ] Post maker comment immediately after going live
- [ ] Share in relevant communities: Indie Hackers, Hacker News (Show HN), r/SEO, r/ChatGPT, r/webdev, r/startups
- [ ] Tweet/post on LinkedIn with a link to the PH listing
- [ ] Ask friends/early users to upvote and engage with comments (not just upvote — comments boost algorithmic ranking)
- [ ] Respond to every comment within the first 2 hours — PH rewards engagement

### Show HN post (same day or day after)

```
Show HN: AI Visibility Audit – free open-source tool to check if AI can "see" your site

https://aivisibilityaudit.cc | https://github.com/codedpills/ai-visibility-audit

ChatGPT and friends are replacing search for high-intent queries. Traditional SEO tools
don't tell you whether LLMs can understand and cite your content. This does.

Paste a URL → crawls up to 10 pages → scores 8 GEO signals (structured data, entity
definition, AI crawlability, etc.) → prioritised recommendations with code examples.

Free, no signup needed for basic use. Built with Node/Fastify, React, PostgreSQL, Redis,
BullMQ, and OpenAI. MIT licence.
```

---

## 8. Positioning and Differentiation

Use this framing consistently across all channels.

### The core insight (say this in your own words)

> _"SEO is about being found by Google's crawlers. GEO is about being understood by AI models. They require different strategies — and until now, no dedicated tool measured the second one."_

### Competitive advantage

| Advantage                                     | Why it matters on PH                                                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Completely free**                           | No freemium trap. 100% of users get real value.                                                                        |
| **Open source (GitHub)**                      | Earns trust from the developer audience that dominates PH. Enables self-hosting.                                       |
| **No signup required**                        | Zero friction. Users can get value before giving anything.                                                             |
| **8 specific, actionable categories**         | Not a vague "AI score" — each category has a score, description, findings from your site, and code examples to fix it. |
| **AI Answerability category uses a real LLM** | Not just heuristics — it literally asks an AI "what does this site do?" and scores the answer.                         |
| **PDF export**                                | Agencies and consultants can hand this to clients.                                                                     |
| **Magic-link auth**                           | No passwords. Lower friction than OAuth. Novelty is a minor talking point.                                             |

### What to avoid saying

- Don't claim it's "the only GEO tool" — there are others. Claim it's free, open-source, and actionable.
- Don't over-promise on the AI Answerability score — it's one signal, not a guarantee of AI citation.
- Don't position against SEO tools as opponents — position them as complementary.

---

## 9. Post-launch Growth Tips

1. **Create audit results for well-known sites** and share them on Twitter/LinkedIn. "We audited OpenAI's website for AI visibility — they scored a 71/100. Here's what they're missing." This creates shareable, topical content.

2. **Target the GEO/SEO community** — the subreddits r/SEO, r/juststart, and communities like Ahrefs' Facebook group are full of people actively looking for this.

3. **Write a "How to improve your GEO score" guide** based on the most common failing categories. Embed the tool. Rank for "GEO score", "AI visibility", "llms.txt".

4. **Reach out to AI/SEO newsletter authors** (e.g. The Rundown, TLDR, Lenny's Newsletter, Marketing Examined) — a free, open-source tool is an easy recommendation.

5. **Add a "Share your score" button** on the results page. Social proof + free distribution.

6. **List on directories**: Futurepedia, There's An AI For That, AI Tools Directory, Toolify.ai, Product Hunt's "Top Products" alternatives. Each is a free backlink + referral traffic.

7. **GitHub README badge** and a "Built with" mention in the repo — devs who fork or star the repo see it.
