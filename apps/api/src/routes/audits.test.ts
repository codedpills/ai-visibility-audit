import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { auditsRoute } from './audits.js';

// Inject mock deps so tests don't need a real DB or queue
const mockEnqueueAudit = vi.fn();
const mockGetAudit = vi.fn();

async function buildApp() {
  const app = Fastify({ logger: false });
  app.register(auditsRoute, {
    enqueueAudit: mockEnqueueAudit,
    getAudit: mockGetAudit,
    jwtSecret: 'test-secret',
  });
  await app.ready();
  return app;
}

describe('POST /audits', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
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

  it('calls enqueueAudit with the submitted url', async () => {
    mockEnqueueAudit.mockResolvedValue('audit-xyz');
    await app.inject({
      method: 'POST',
      url: '/audits',
      payload: { url: 'https://acme.com' },
    });
    expect(mockEnqueueAudit).toHaveBeenCalledWith('https://acme.com', null);
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
