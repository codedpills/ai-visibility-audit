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

User-agent: Google-Extended
Allow: /`,
  'semantic-structure': `<!-- One H1 per page -->
<h1>Your Primary Page Topic</h1>

<!-- Question-phrased H2s for AI parsability -->
<h2>What is [topic]?</h2>
<h2>How does [topic] work?</h2>`,
};

function getPriority(score: number, maxScore: number): RecommendationPriority {
  if (score === 0) return 'critical';
  if (score < maxScore * 0.6) return 'medium';
  return 'low';
}

export function generateRecommendations(findings: Finding[]): Recommendation[] {
  const recs: Recommendation[] = findings
    .filter((f) => f.score < f.maxScore)
    .map((f) => {
      const priority = getPriority(f.score, f.maxScore);
      const rec: Recommendation = {
        priority,
        category: f.category,
        title: TITLES[f.category],
        description: DESCRIPTIONS[f.category],
      };
      if (priority === 'critical' && SNIPPETS[f.category]) {
        rec.snippet = SNIPPETS[f.category];
      }
      return rec;
    });

  return recs.sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  );
}
