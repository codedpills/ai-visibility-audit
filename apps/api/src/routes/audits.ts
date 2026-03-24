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
  enqueueAudit: (url: string) => Promise<string>;
  getAudit: (id: string) => Promise<AuditRowResponse | null>;
}

const URL_RE = /^https?:\/\/.+\..+/;

export const auditsRoute: FastifyPluginAsync<AuditRouteDeps> = async (
  fastify,
  opts
) => {
  const { enqueueAudit, getAudit } = opts;

  fastify.post<{ Body: { url?: string } }>(
    '/audits',
    async (request, reply) => {
      const { url } = request.body ?? {};

      if (!url || !URL_RE.test(url)) {
        return reply
          .status(400)
          .send({ error: 'A valid http/https url is required.' });
      }

      const auditId = await enqueueAudit(url);
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
