import Fastify, { type FastifyPluginAsync } from 'fastify';
import cookie from '@fastify/cookie';
import type { Kysely } from 'kysely';
import type { Database } from '../types/database.js';
import type { UserRow } from '../db/users.js';
import { signJwt, verifyJwt } from '../auth/jwt.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOKIE_NAME = 'session';

export interface AuthRouteDeps {
  upsertUser: (db: Kysely<Database>, email: string) => Promise<UserRow>;
  findUserById: (db: Kysely<Database>, id: string) => Promise<UserRow | null>;
  saveMagicLink: (
    db: Kysely<Database>,
    userId: string,
    hash: string,
    expiresAt: Date
  ) => Promise<void>;
  verifyMagicLink: (
    db: Kysely<Database>,
    hash: string
  ) => Promise<UserRow | null>;
  sendMagicLinkEmail: (email: string, token: string) => Promise<void>;
  generateToken: () => string;
  hashToken: (token: string) => string;
  jwtSecret: string;
  monthlyLimit: number;
  db?: Kysely<Database>;
}

/** Registers auth routes onto a Fastify instance. */
export const authRoute: FastifyPluginAsync<AuthRouteDeps> = async (
  fastify,
  opts
) => {
  const {
    upsertUser,
    findUserById,
    saveMagicLink,
    verifyMagicLink,
    sendMagicLinkEmail,
    generateToken,
    hashToken,
    jwtSecret,
    monthlyLimit,
    db,
  } = opts;

  const getDb = () => db ?? ({} as Kysely<Database>);

  fastify.post<{ Body: { email?: string } }>(
    '/auth/magic-link',
    async (req, reply) => {
      const { email } = req.body ?? {};
      if (!email || !EMAIL_RE.test(email)) {
        return reply
          .status(400)
          .send({ error: 'A valid email address is required.' });
      }

      const user = await upsertUser(getDb(), email);
      const token = generateToken();
      const hash = hashToken(token);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await saveMagicLink(getDb(), user.id, hash, expiresAt);
      await sendMagicLinkEmail(email, token);

      return reply.send({
        message: 'Check your email for a login link. It expires in 15 minutes.',
      });
    }
  );

  fastify.get<{ Querystring: { token?: string } }>(
    '/auth/verify',
    async (req, reply) => {
      const { token } = req.query;
      if (!token) {
        return reply.status(400).send({ error: 'Token is required.' });
      }

      const hash = hashToken(token);
      const user = await verifyMagicLink(getDb(), hash);
      if (!user) {
        return reply.status(401).send({
          error: 'Invalid or expired link. Please request a new one.',
        });
      }

      const jwt = await signJwt({ sub: user.id, email: user.email }, jwtSecret);
      const isProd = process.env.NODE_ENV === 'production';
      reply.setCookie(COOKIE_NAME, jwt, {
        httpOnly: true,
        secure: isProd,
        // SameSite=None required for cross-origin credentials (web and API on different Railway subdomains)
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return reply.send({ message: 'Logged in successfully.' });
    }
  );

  fastify.get('/auth/me', async (req, reply) => {
    const token = (req.cookies as Record<string, string | undefined>)?.[
      COOKIE_NAME
    ];
    if (!token) {
      return reply.status(401).send({ error: 'Not authenticated.' });
    }

    let payload: { sub: string; email: string };
    try {
      payload = await verifyJwt(token, jwtSecret);
    } catch {
      return reply
        .status(401)
        .send({ error: 'Session expired. Please log in again.' });
    }

    const user = await findUserById(getDb(), payload.sub);
    if (!user) {
      return reply.status(401).send({ error: 'User not found.' });
    }

    const firstOfNextMonth = new Date();
    firstOfNextMonth.setDate(1);
    firstOfNextMonth.setMonth(firstOfNextMonth.getMonth() + 1);
    firstOfNextMonth.setHours(0, 0, 0, 0);

    return reply.send({
      id: user.id,
      email: user.email,
      auditsThisMonth: user.audits_this_month,
      monthlyLimit,
      monthResetAt: firstOfNextMonth.toISOString(),
      donated: user.donated,
      donationPoints: user.donation_points,
    });
  });

  fastify.post('/auth/logout', async (_req, reply) => {
    reply.setCookie(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return reply.send({ message: 'Logged out.' });
  });
};

/** Test helper: creates a standalone Fastify app with cookie support + auth routes. */
export async function buildAuthServer(deps: AuthRouteDeps) {
  const app = Fastify({ logger: false });
  await app.register(cookie);
  await app.register(authRoute, deps);
  await app.ready();
  return app;
}
