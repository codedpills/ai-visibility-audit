import { jwtVerify } from 'jose';
import type { FastifyPluginAsync } from 'fastify';

export interface UsersRouteDeps {
  jwtSecret: string;
  getAuditsByUser: (userId: string) => Promise<
    Array<{
      id: string;
      url: string;
      status: string;
      geo_score: number | null;
      expires_at: Date | null;
      created_at: Date;
    }>
  >;
}

export const usersRoute: FastifyPluginAsync<UsersRouteDeps> = async (
  fastify,
  opts
) => {
  const { jwtSecret, getAuditsByUser } = opts;
  const secretKey = new TextEncoder().encode(jwtSecret);

  fastify.get('/users/me/audits', async (request, reply) => {
    const token = request.cookies?.['session'];
    if (!token) {
      return reply.status(401).send({ error: 'Authentication required.' });
    }

    let userId: string;
    try {
      const { payload } = await jwtVerify(token, secretKey);
      userId = (payload as { sub?: string }).sub ?? '';
      if (!userId) throw new Error('missing sub');
    } catch {
      return reply.status(401).send({ error: 'Invalid or expired session.' });
    }

    const rows = await getAuditsByUser(userId);

    return reply.send({
      audits: rows.map((r) => ({
        id: r.id,
        url: r.url,
        status: r.status,
        geoScore: r.geo_score,
        expiresAt: r.expires_at,
        createdAt: r.created_at,
      })),
    });
  });
};
