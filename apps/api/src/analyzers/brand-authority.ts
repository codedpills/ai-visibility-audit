import type { CrawlResult } from '../crawler/types.js';
import type { AnalyzerResult } from './types.js';
import type { Finding } from '@repo/shared';

const MAX_SCORE = 15;

const CONTACT_PATH_RE = /\/(contact|get-in-touch|reach-us|support)(\/|$)/i;
const TEAM_PATH_RE = /\/(about|team|who-we-are|our-story|company)/i;

const SOCIAL_DOMAINS_RE =
  /^https?:\/\/(www\.)?(twitter|x|linkedin|facebook|instagram|youtube|github|tiktok)\.(com|io)\//i;

const AUTHORITY_DOMAINS_RE =
  /^https?:\/\/(www\.)?(techcrunch|producthunt|ycombinator|forbes|wired|venturebeat|github|npmjs|pypi|medium|dev\.to)\.(com|io)\//i;

const SOCIAL_PROOF_RE =
  /\b(testimonials?|reviews?|customers?\s+say|what\s+(our\s+)?customers|case\s+stud|success\s+stor|rated|\d+\s+star|\bG2\b|\bCapterra\b)/i;

function hasPath(pages: CrawlResult['pages'], re: RegExp): boolean {
  return pages.some((p) => re.test(p.url));
}

function hasExternalLinks(pages: CrawlResult['pages'], re: RegExp): boolean {
  return pages.some((p) => p.externalLinks.some((l) => re.test(l)));
}

function scoreContactPage(pages: CrawlResult['pages']): Finding {
  const present = hasPath(pages, CONTACT_PATH_RE);
  return {
    category: 'brand-authority',
    signal: 'contact-page',
    score: present ? 3 : 0,
    maxScore: 3,
    details: present
      ? 'Contact page found — adds trust and legitimacy.'
      : 'No contact page detected. Adding one improves brand trust signals.',
  };
}

function scoreTeamPage(pages: CrawlResult['pages']): Finding {
  const present = hasPath(pages, TEAM_PATH_RE);
  return {
    category: 'brand-authority',
    signal: 'team-page',
    score: present ? 3 : 0,
    maxScore: 3,
    details: present
      ? 'About/team page found — humanises the brand.'
      : 'No about or team page found. Adding one helps AI models attribute your brand correctly.',
  };
}

function scoreExternalAuthorityLinks(pages: CrawlResult['pages']): Finding {
  const present = hasExternalLinks(pages, AUTHORITY_DOMAINS_RE);
  return {
    category: 'brand-authority',
    signal: 'external-authority-links',
    score: present ? 3 : 0,
    maxScore: 3,
    details: present
      ? 'Site links to authoritative third-party domains (press, developer resources, etc.).'
      : 'No links to well-known authority domains detected.',
  };
}

function scoreSocialProof(pages: CrawlResult['pages']): Finding {
  const allMarkdown = pages.map((p) => p.markdown).join('\n');
  const present = SOCIAL_PROOF_RE.test(allMarkdown);
  return {
    category: 'brand-authority',
    signal: 'social-proof',
    score: present ? 3 : 0,
    maxScore: 3,
    details: present
      ? 'Social proof (testimonials, reviews, or case studies) found.'
      : 'No social proof detected. Adding testimonials or case studies strengthens brand authority.',
  };
}

function scoreSocialProfiles(pages: CrawlResult['pages']): Finding {
  const present = hasExternalLinks(pages, SOCIAL_DOMAINS_RE);
  return {
    category: 'brand-authority',
    signal: 'social-profiles',
    score: present ? 3 : 0,
    maxScore: 3,
    details: present
      ? 'Site links to social media profiles — helps AI models verify brand identity.'
      : 'No social media profile links found.',
  };
}

export function analyzeBrandAuthority(
  crawlResult: CrawlResult
): AnalyzerResult {
  const { pages } = crawlResult;

  const findings: Finding[] = [
    scoreContactPage(pages),
    scoreTeamPage(pages),
    scoreExternalAuthorityLinks(pages),
    scoreSocialProof(pages),
    scoreSocialProfiles(pages),
  ];

  const score = findings.reduce((sum, f) => sum + f.score, 0);

  return {
    category: 'brand-authority',
    score,
    maxScore: MAX_SCORE,
    findings,
  };
}
