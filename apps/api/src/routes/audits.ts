import { jwtVerify } from 'jose';
import type { FastifyPluginAsync } from 'fastify';

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
}

const URL_RE = /^https?:\/\/.+\..+/;

export const auditsRoute: FastifyPluginAsync<AuditRouteDeps> = async (
  fastify,
  opts
) => {
  const { enqueueAudit, getAudit, jwtSecret } = opts;
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

      // Optionally resolve the logged-in user for extended retention.
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

      const auditId = await enqueueAudit(url, userId);
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
