import type { FastifyPluginAsync } from 'fastify';
import type { Kysely } from 'kysely';
import type { Database } from '../types/database.js';
import type { UserRow } from '../db/users.js';

export interface KofiRouteDeps {
  findUserByEmail: (
    db: Kysely<Database>,
    email: string
  ) => Promise<UserRow | null>;
  recordDonation: (
    db: Kysely<Database>,
    userId: string,
    points: number
  ) => Promise<void>;
  verificationToken: string;
  db: Kysely<Database>;
}

interface KofiPayload {
  verification_token: string;
  email: string;
  amount: string;
  [key: string]: unknown;
}

export const kofiRoute: FastifyPluginAsync<KofiRouteDeps> = async (
  fastify,
  opts
) => {
  const { findUserByEmail, recordDonation, verificationToken, db } = opts;

  // Ko-fi sends application/x-www-form-urlencoded with a `data` field containing JSON
  fastify.addContentTypeParser(
    'application/x-www-form-urlencoded',
    { parseAs: 'string' },
    (_req, body, done) => {
      try {
        const params = new URLSearchParams(body as string);
        done(null, { data: params.get('data') });
      } catch (err) {
        done(err as Error, undefined);
      }
    }
  );

  fastify.post<{ Body: { data?: string } }>(
    '/webhooks/kofi',
    async (req, reply) => {
      let payload: KofiPayload;
      try {
        payload = JSON.parse(req.body?.data ?? '') as KofiPayload;
      } catch {
        return reply.status(400).send({ error: 'Invalid payload.' });
      }

      if (payload.verification_token !== verificationToken) {
        return reply.status(400).send({ error: 'Invalid verification token.' });
      }

      const { email, amount } = payload;
      const points = Math.floor(parseFloat(amount) || 0);

      const user = await findUserByEmail(db, email);
      if (user && points > 0) {
        await recordDonation(db, user.id, points);
      }

      // Always return 200 — Ko-fi retries on non-200
      return reply.status(200).send({ received: true });
    }
  );
};
