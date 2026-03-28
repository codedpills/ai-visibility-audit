import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { SignJWT } from 'jose';
import { usersRoute } from './users.js';

const mockGetAuditsByUser = vi.fn();

const JWT_SECRET = 'test-secret';

async function buildApp() {
  const app = Fastify({ logger: false });
  app.register(cookie);
  app.register(usersRoute, {
    jwtSecret: JWT_SECRET,
    getAuditsByUser: mockGetAuditsByUser,
  });
  await app.ready();
  return app;
}

async function makeSessionCookie(userId: string) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
  return `session=${token}`;
}

describe('GET /users/me/audits', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
  });

  it('returns 401 when no session cookie is present', async () => {
    const res = await app.inject({ method: 'GET', url: '/users/me/audits' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 when session cookie is invalid', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/users/me/audits',
      headers: { cookie: 'session=bad-token' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with audits array for authenticated user', async () => {
    const audits = [
      {
        id: 'a1',
        url: 'https://example.com',
        status: 'done',
        geo_score: 72,
        expires_at: null,
        created_at: '2026-03-28T00:00:00.000Z',
      },
    ];
    mockGetAuditsByUser.mockResolvedValue(audits);
    const cookieHeader = await makeSessionCookie('user-1');

    const res = await app.inject({
      method: 'GET',
      url: '/users/me/audits',
      headers: { cookie: cookieHeader },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.audits).toHaveLength(1);
    expect(body.audits[0].id).toBe('a1');
    expect(body.audits[0].geoScore).toBe(72);
  });

  it('calls getAuditsByUser with the userId from the JWT', async () => {
    mockGetAuditsByUser.mockResolvedValue([]);
    const cookieHeader = await makeSessionCookie('user-42');

    await app.inject({
      method: 'GET',
      url: '/users/me/audits',
      headers: { cookie: cookieHeader },
    });

    expect(mockGetAuditsByUser).toHaveBeenCalledWith('user-42');
  });

  it('returns an empty array when user has no audits', async () => {
    mockGetAuditsByUser.mockResolvedValue([]);
    const cookieHeader = await makeSessionCookie('user-empty');

    const res = await app.inject({
      method: 'GET',
      url: '/users/me/audits',
      headers: { cookie: cookieHeader },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().audits).toEqual([]);
  });
});
