import { jwtVerify } from 'jose';
import type { FastifyPluginAsync } from 'fastify';
import type { RateLimitResult } from '../middleware/rate-limit.js';

export interface AuditRowResponse {
  id: string;
  url: string;
  status: string;
  geo_score: number | null;
  category_scores: unknown;
  findings: unknown;
  recommendations: unknown;
  expires_at: string | Date | null;
  created_at: string | Date;
  [key: string]: unknown;
}

export interface AuditRouteDeps {
  enqueueAudit: (url: string, userId?: string | null) => Promise<string>;
  getAudit: (id: string) => Promise<AuditRowResponse | null>;
  jwtSecret: string;
  checkAnon: (anonId: string, ip: string) => Promise<RateLimitResult>;
  checkRegistered: (userId: string) => Promise<RateLimitResult>;
  incrementUserAuditCount: (userId: string) => Promise<void>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Private/reserved IP ranges that must not be crawled (SSRF prevention).
// Covers loopback, link-local, RFC-1918, and the most common cloud metadata IP.
const PRIVATE_IP_RE =
  /^(127\.|0\.0\.0\.0|169\.254\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/;

/**
 * Returns true if the URL is safe to crawl:
 * - scheme must be https
 * - hostname must not be localhost / loopback / private range
 */
function isSafeAuditUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'https:') return false;

  const host = parsed.hostname.toLowerCase();

  // Block loopback and IPv6 localhost
  if (host === 'localhost' || host === '::1' || host === '[::1]') return false;

  // Block private/reserved IPv4 ranges
  if (PRIVATE_IP_RE.test(host)) return false;

  // Require at least one dot (ruling out bare hostnames / single-label names)
  if (!host.includes('.')) return false;

  return true;
}

export const auditsRoute: FastifyPluginAsync<AuditRouteDeps> = async (
  fastify,
  opts
) => {
  const {
    enqueueAudit,
    getAudit,
    jwtSecret,
    checkAnon,
    checkRegistered,
    incrementUserAuditCount,
  } = opts;
  const secretKey = new TextEncoder().encode(jwtSecret);

  fastify.post<{ Body: { url?: string } }>(
    '/audits',
    async (request, reply) => {
      const { url } = request.body ?? {};

      if (!url || !isSafeAuditUrl(url)) {
        return reply
          .status(400)
          .send({ error: 'A valid https URL is required.' });
      }

      // Resolve the logged-in user for rate limiting and retention.
      let userId: string | null = null;
      const token = request.cookies?.['session'];
      if (token) {
        try {
          const { payload } = await jwtVerify(token, secretKey, {
            algorithms: ['HS256'],
          });
          userId = (payload as { sub?: string }).sub ?? null;
        } catch {
          // Invalid/expired token — treat as anonymous
        }
      }

      // Enforce rate limit
      if (userId) {
        const limit = await checkRegistered(userId);
        if (!limit.allowed) {
          return reply.status(429).send({
            error: 'Monthly audit limit reached.',
            resetsAt: limit.resetsAt,
          });
        }
      } else {
        // Only accept well-formed UUID anonIds — reject arbitrary strings to
        // prevent crafted Redis key attacks. Fall back to IP-only on invalid.
        const rawAnonId = (request.headers['x-anon-id'] as string) ?? '';
        const anonId = UUID_RE.test(rawAnonId) ? rawAnonId : '';
        const ip = request.ip;
        const limit = await checkAnon(anonId, ip);
        if (!limit.allowed) {
          return reply.status(429).send({
            error: 'Monthly audit limit reached.',
            resetsAt: limit.resetsAt,
          });
        }
      }

      const auditId = await enqueueAudit(url, userId);

      // Track usage for registered users
      if (userId) {
        await incrementUserAuditCount(userId);
      }

      return reply.status(201).send({ auditId, status: 'pending' });
    }
  );

  fastify.get<{ Params: { id: string } }>(
    '/audits/:id',
    async (request, reply) => {
      const audit = await getAudit(request.params.id);

      if (!audit) {
        return reply.status(404).send({ error: 'Audit not found.' });
      }

      // Prevent search engines from indexing individual audit result URLs.
      // Audit UUIDs are capability URLs — they're not secret, but they should
      // not be crawlable/indexable.
      reply.header('X-Robots-Tag', 'noindex, nofollow');

      // Map snake_case DB columns to camelCase API response
      return reply.send({
        id: audit.id,
        url: audit.url,
        status: audit.status,
        geoScore: audit.geo_score,
        categoryScores: audit.category_scores ?? null,
        findings: audit.findings ?? null,
        recommendations: audit.recommendations ?? null,
        expiresAt: audit.expires_at ?? null,
        createdAt: audit.created_at,
      });
    }
  );
};
