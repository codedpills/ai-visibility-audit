import robotsParser from 'robots-parser';

const AI_CRAWLERS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'];

export interface RobotsTxtResult {
  raw: string;
  blockedBots: string[];
}

export function parseRobotsTxt(
  robotsTxtContent: string,
  siteUrl: string
): RobotsTxtResult {
  const robots = robotsParser(siteUrl + '/robots.txt', robotsTxtContent);

  const rootUrl = siteUrl.replace(/\/$/, '') + '/';
  const blockedBots = AI_CRAWLERS.filter((bot) => {
    // Check if the bot is disallowed from crawling the root (must use full URL)
    return robots.isDisallowed(rootUrl, bot) === true;
  });

  return {
    raw: robotsTxtContent,
    blockedBots,
  };
}
