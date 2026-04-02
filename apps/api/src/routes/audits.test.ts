import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { SignJWT } from 'jose';
import { auditsRoute } from './audits.js';

// Inject mock deps so tests don't need a real DB or queue
const mockEnqueueAudit = vi.fn();
const mockGetAudit = vi.fn();
const mockCheckAnon = vi.fn();
const mockCheckRegistered = vi.fn();
const mockIncrementUserAuditCount = vi.fn();

const JWT_SECRET = 'test-secret';

async function buildApp() {
  const app = Fastify({ logger: false });
  app.register(cookie);
  app.register(auditsRoute, {
    enqueueAudit: mockEnqueueAudit,
    getAudit: mockGetAudit,
    jwtSecret: JWT_SECRET,
    checkAnon: mockCheckAnon,
    checkRegistered: mockCheckRegistered,
    incrementUserAuditCount: mockIncrementUserAuditCount,
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

describe('POST /audits', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCheckAnon.mockResolvedValue({ allowed: true });
    mockCheckRegistered.mockResolvedValue({ allowed: true });
    mockIncrementUserAuditCount.mockResolvedValue(undefined);
    app = await buildApp();
  });

  it('returns 201 with auditId and status pending', async () => {
    mockEnqueueAudit.mockResolvedValue('audit-abc');

    const res = await app.inject({
      method: 'POST',
      url: '/audits',
      payload: { url: 'https://example.com' },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.auditId).toBe('audit-abc');
    expect(body.status).toBe('pending');
  });

  it('returns 400 when url is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/audits',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when url is not a valid URL', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/audits',
      payload: { url: 'not-a-url' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for http (non-https) URLs', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/audits',
      payload: { url: 'http://example.com' },
    });
    expect(res.statusCode).toBe(400);
  });

  it.each([
    'https://localhost',
    'https://localhost:8080',
    'https://127.0.0.1',
    'https://127.0.0.1:3000',
    'https://0.0.0.0',
    'https://[::1]',
    'https://192.168.1.1',
    'https://10.0.0.1',
    'https://172.16.0.1',
    'https://172.31.255.255',
    'https://169.254.169.254',
  ])('returns 400 for SSRF target URL %s', async (url) => {
    const res = await app.inject({
      method: 'POST',
      url: '/audits',
      payload: { url },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when x-anon-id is not a valid UUID', async () => {
    mockEnqueueAudit.mockResolvedValue('a5');
    await app.inject({
      method: 'POST',
      url: '/audits',
      headers: { 'x-anon-id': 'not-a-uuid' },
      payload: { url: 'https://example.com' },
    });
    // Invalid anonId falls back to IP-only rate limiting — still allowed, not blocked
    expect(mockCheckAnon).toHaveBeenCalledWith('', expect.any(String));
  });

  it('passes valid UUID anonId to checkAnon unchanged', async () => {
    mockEnqueueAudit.mockResolvedValue('a6');
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    await app.inject({
      method: 'POST',
      url: '/audits',
      headers: { 'x-anon-id': validUuid },
      payload: { url: 'https://example.com' },
    });
    expect(mockCheckAnon).toHaveBeenCalledWith(validUuid, expect.any(String));
  });

  it('calls enqueueAudit with the submitted url', async () => {
    mockEnqueueAudit.mockResolvedValue('audit-xyz');
    await app.inject({
      method: 'POST',
      url: '/audits',
      payload: { url: 'https://acme.com' },
    });
    expect(mockEnqueueAudit).toHaveBeenCalledWith('https://acme.com', null);
  });

  it('returns 429 when anon daily limit is exceeded', async () => {
    mockCheckAnon.mockResolvedValue({
      allowed: false,
      resetsAt: '2026-03-29T00:00:00.000Z',
    });
    const res = await app.inject({
      method: 'POST',
      url: '/audits',
      headers: { 'x-anon-id': 'anon-uuid-123' },
      payload: { url: 'https://example.com' },
    });
    expect(res.statusCode).toBe(429);
    expect(res.json().resetsAt).toBe('2026-03-29T00:00:00.000Z');
  });

  it('passes anonId header to checkAnon', async () => {
    mockEnqueueAudit.mockResolvedValue('a1');
    const validUuid = '550e8400-e29b-41d4-a716-446655440001';
    await app.inject({
      method: 'POST',
      url: '/audits',
      headers: { 'x-anon-id': validUuid },
      payload: { url: 'https://example.com' },
    });
    expect(mockCheckAnon).toHaveBeenCalledWith(validUuid, expect.any(String));
  });

  it('returns 429 when registered monthly limit is exceeded', async () => {
    mockCheckRegistered.mockResolvedValue({
      allowed: false,
      resetsAt: '2026-04-01T00:00:00.000Z',
    });
    const cookie = await makeSessionCookie('user-1');
    const res = await app.inject({
      method: 'POST',
      url: '/audits',
      headers: { cookie },
      payload: { url: 'https://example.com' },
    });
    expect(res.statusCode).toBe(429);
    expect(res.json().resetsAt).toBe('2026-04-01T00:00:00.000Z');
  });

  it('calls checkRegistered (not checkAnon) for authenticated users', async () => {
    mockEnqueueAudit.mockResolvedValue('a2');
    const cookie = await makeSessionCookie('user-2');
    await app.inject({
      method: 'POST',
      url: '/audits',
      headers: { cookie },
      payload: { url: 'https://example.com' },
    });
    expect(mockCheckRegistered).toHaveBeenCalledWith('user-2');
    expect(mockCheckAnon).not.toHaveBeenCalled();
  });

  it('increments audit count for registered user on success', async () => {
    mockEnqueueAudit.mockResolvedValue('a3');
    const cookie = await makeSessionCookie('user-3');
    await app.inject({
      method: 'POST',
      url: '/audits',
      headers: { cookie },
      payload: { url: 'https://example.com' },
    });
    expect(mockIncrementUserAuditCount).toHaveBeenCalledWith('user-3');
  });

  it('does not increment audit count for anonymous users', async () => {
    mockEnqueueAudit.mockResolvedValue('a4');
    await app.inject({
      method: 'POST',
      url: '/audits',
      payload: { url: 'https://example.com' },
    });
    expect(mockIncrementUserAuditCount).not.toHaveBeenCalled();
  });
});

describe('GET /audits/:id', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
  });

  it('returns 200 with audit data when found', async () => {
    const audit = {
      id: 'audit-123',
      url: 'https://example.com',
      status: 'done',
      geo_score: 72,
      category_scores: [],
      findings: [],
      recommendations: [],
      expires_at: null,
      created_at: new Date().toISOString(),
    };
    mockGetAudit.mockResolvedValue(audit);

    const res = await app.inject({
      method: 'GET',
      url: '/audits/audit-123',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe('audit-123');
    expect(res.json().status).toBe('done');
    expect(res.json().geoScore).toBe(72);
  });

  it('returns 404 when audit not found', async () => {
    mockGetAudit.mockResolvedValue(null);
    const res = await app.inject({
      method: 'GET',
      url: '/audits/nonexistent',
    });
    expect(res.statusCode).toBe(404);
  });

  it('calls getAudit with the route param id', async () => {
    mockGetAudit.mockResolvedValue(null);
    await app.inject({ method: 'GET', url: '/audits/my-id' });
    expect(mockGetAudit).toHaveBeenCalledWith('my-id');
  });
});
