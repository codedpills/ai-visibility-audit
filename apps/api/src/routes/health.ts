import type { FastifyInstance } from 'fastify';
import { sql } from 'kysely';
import { db } from '../db.js';
import { redis } from '../redis.js';

export async function healthRoute(app: FastifyInstance) {
  app.get('/health', async (_request, reply) => {
    try {
      await sql`SELECT 1`.execute(db);
      await redis.ping();
      return reply.send({ status: 'ok', db: 'ok', redis: 'ok' });
    } catch (err) {
      app.log.error(err, 'Health check failed');
      return reply.status(503).send({
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });
}
