import type {
  Finding,
  Recommendation,
  RecommendationPriority,
  AuditCategory,
} from '@repo/shared';

const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  critical: 0,
  medium: 1,
  low: 2,
};

const TITLES: Record<AuditCategory, string> = {
  'entity-definition': 'Define your brand entity clearly',
  'content-clarity': 'Improve content clarity and structure',
  'topic-authority': 'Strengthen topical authority',
  'semantic-structure': 'Improve semantic HTML structure',
  'structured-data': 'Add structured data markup',
  'ai-crawlability': 'Improve AI crawler accessibility',
  'brand-authority': 'Build brand authority signals',
  'ai-answerability': 'Make content more directly answerable',
};

const DESCRIPTIONS: Record<AuditCategory, string> = {
  'entity-definition':
    'Ensure your site clearly defines who you are, what you do, and includes schema markup for your organisation or person entity.',
  'content-clarity':
    'Use bullet lists, FAQ sections, and plain-language summaries so AI models can extract and cite your content accurately.',
  'topic-authority':
    'Publish in-depth content across related topics and acquire backlinks from authoritative sources in your niche.',
  'semantic-structure':
    'Use a single H1 per page, question-phrased H2s, and short paragraphs so AI systems can parse your document structure.',
  'structured-data':
    'Add JSON-LD structured data (Organization, FAQPage, Article, etc.) to help AI systems understand your content semantics.',
  'ai-crawlability':
    'Ensure your robots.txt allows AI crawlers (GPTBot, ClaudeBot, etc.) and provide an llms.txt file with a site summary.',
  'brand-authority':
    'Increase mentions of your brand across authoritative sites, Wikipedia, and industry publications.',
  'ai-answerability':
    'Structure your content to directly answer common questions in your domain using concise, factual language.',
};

const SNIPPETS: Partial<Record<AuditCategory, string>> = {
  'entity-definition': `<!-- Add Organization schema to your homepage <head> -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company Name",
  "url": "https://yoursite.com",
  "description": "One-sentence description of what you do and who you serve.",
  "foundingDate": "2020",
  "sameAs": [
    "https://twitter.com/yourhandle",
    "https://linkedin.com/company/yourcompany"
  ]
}
</script>`,
  'content-clarity': `<!-- Add a plain-language FAQ section to your page -->
<section>
  <h2>Frequently Asked Questions</h2>
  <div itemscope itemtype="https://schema.org/FAQPage">
    <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <h3 itemprop="name">What does [Your Company] do?</h3>
      <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <p itemprop="text">
          [Your Company] helps [target audience] to [achieve outcome]
          by [your unique approach].
        </p>
      </div>
    </div>
  </div>
</section>`,
  'topic-authority': `<!-- Add a HowTo or Article schema to your in-depth content pages -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your In-Depth Guide Title",
  "author": { "@type": "Organization", "name": "Your Company" },
  "datePublished": "2025-01-01",
  "description": "A comprehensive guide to [topic] covering [key areas]."
}
</script>`,
  'semantic-structure': `<!-- One H1 per page -->
<h1>Your Primary Page Topic</h1>

<!-- Question-phrased H2s help AI parse your content -->
<h2>What is [topic]?</h2>
<p>Brief, direct answer in 1-2 sentences.</p>

<h2>How does [topic] work?</h2>
<p>Step-by-step explanation in short paragraphs.</p>

<h2>Who is [topic] for?</h2>
<p>Clear audience definition.</p>`,
  'structured-data': `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company",
  "url": "https://yoursite.com",
  "description": "What your company does"
}
</script>`,
  'ai-crawlability': `# robots.txt — allow major AI crawlers
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /`,
  'brand-authority': `<!-- Add your brand entity to Wikipedia-adjacent sources via Wikidata -->
<!-- Short-term: add a press/media page with clear brand facts -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company",
  "url": "https://yoursite.com",
  "logo": "https://yoursite.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "support@yoursite.com"
  }
}
</script>`,
  'ai-answerability': `<!-- Structure your content to directly answer questions -->
<!-- Before: vague promotional text -->
<p>We offer best-in-class solutions for modern businesses.</p>

<!-- After: direct, citable answer -->
<p>
  [Your Company] is a [category] tool that helps [audience] to
  [specific outcome]. It works by [mechanism], typically
  delivering [result] within [timeframe].
</p>`,
};

function getPriority(score: number, maxScore: number): RecommendationPriority {
  if (score === 0) return 'critical';
  if (score < maxScore * 0.6) return 'medium';
  return 'low';
}

export function generateRecommendations(findings: Finding[]): Recommendation[] {
  // Build one recommendation per category, keeping the worst-scoring finding
  const worst = new Map<AuditCategory, Finding>();
  for (const f of findings) {
    if (f.score >= f.maxScore) continue;
    const prev = worst.get(f.category);
    if (
      !prev ||
      PRIORITY_ORDER[getPriority(f.score, f.maxScore)] <
        PRIORITY_ORDER[getPriority(prev.score, prev.maxScore)]
    ) {
      worst.set(f.category, f);
    }
  }

  const recs: Recommendation[] = Array.from(worst.values()).map((f) => {
    const priority = getPriority(f.score, f.maxScore);
    const rec: Recommendation = {
      priority,
      category: f.category,
      title: TITLES[f.category],
      description: DESCRIPTIONS[f.category],
    };
    if (SNIPPETS[f.category]) {
      rec.snippet = SNIPPETS[f.category];
    }
    return rec;
  });

  return recs.sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  );
}
