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

const URL_RE = /^https?:\/\/.+\..+/;

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

      if (!url || !URL_RE.test(url)) {
        return reply
          .status(400)
          .send({ error: 'A valid http/https url is required.' });
      }

      // Resolve the logged-in user for rate limiting and retention.
      let userId: string | null = null;
      const token = request.cookies?.['session'];
      if (token) {
        try {
          const { payload } = await jwtVerify(token, secretKey);
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
        const anonId = (request.headers['x-anon-id'] as string) ?? '';
        const ip = request.ip;
        const limit = await checkAnon(anonId, ip);
        if (!limit.allowed) {
          return reply.status(429).send({
            error: 'Daily audit limit reached. Try again tomorrow.',
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
