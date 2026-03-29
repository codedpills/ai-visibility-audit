import { describe, it, expect, vi } from 'vitest';
import Fastify from 'fastify';
import { emailRoute } from './email.js';
import type { Recommendation } from '@repo/shared';

const mockRecommendations: Recommendation[] = [
  {
    priority: 'critical',
    category: 'structured-data',
    title: 'Add structured data',
    description: 'Add JSON-LD',
    snippet: '<script type="application/ld+json">...</script>',
  },
  {
    priority: 'medium',
    category: 'entity-definition',
    title: 'Define entity',
    description: 'Clarify your brand',
  },
  {
    priority: 'low',
    category: 'content-clarity',
    title: 'Improve clarity',
    description: 'Add FAQ',
  },
];

const defaultDeps = () => ({
  getAudit: vi.fn().mockResolvedValue({ recommendations: mockRecommendations }),
  saveEmail: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi
    .fn()
    .mockResolvedValue({ id: 'user-1', email: 'user@example.com' }),
  generateToken: vi.fn().mockReturnValue('tok123'),
  hashToken: vi.fn().mockReturnValue('hash123'),
  saveMagicLink: vi.fn().mockResolvedValue(undefined),
  sendResultsMagicLinkEmail: vi.fn().mockResolvedValue(undefined),
  linkAuditToUser: vi.fn().mockResolvedValue(true),
  incrementUserAuditCount: vi.fn().mockResolvedValue(undefined),
  webBaseUrl: 'https://example.com',
});

function buildApp(overrides: Partial<ReturnType<typeof defaultDeps>> = {}) {
  const app = Fastify();
  app.register(emailRoute, { ...defaultDeps(), ...overrides });
  return app;
}

describe('POST /audits/:id/email', () => {
  it('returns 400 for missing email', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/audits/abc-123/email',
      body: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/audits/abc-123/email',
      body: { email: 'not-an-email' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when audit does not exist', async () => {
    const app = buildApp({ getAudit: vi.fn().mockResolvedValue(null) });
    const res = await app.inject({
      method: 'POST',
      url: '/audits/missing-id/email',
      body: { email: 'user@example.com' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('saves the email and returns 201 with full recommendations', async () => {
    const saveEmail = vi.fn().mockResolvedValue(undefined);
    const app = buildApp({ saveEmail });
    const res = await app.inject({
      method: 'POST',
      url: '/audits/audit-123/email',
      body: { email: 'user@example.com' },
    });
    expect(res.statusCode).toBe(201);
    expect(saveEmail).toHaveBeenCalledWith('audit-123', 'user@example.com');
    const body = res.json();
    expect(body.recommendations).toHaveLength(3);
  });

  it('upserts user and sends magic link email with redirect to results', async () => {
    const upsertUser = vi
      .fn()
      .mockResolvedValue({ id: 'u42', email: 'user@example.com' });
    const saveMagicLink = vi.fn().mockResolvedValue(undefined);
    const sendResultsMagicLinkEmail = vi.fn().mockResolvedValue(undefined);
    const generateToken = vi.fn().mockReturnValue('mytoken');
    const hashToken = vi.fn().mockReturnValue('myhash');

    const app = buildApp({
      upsertUser,
      saveMagicLink,
      sendResultsMagicLinkEmail,
      generateToken,
      hashToken,
      webBaseUrl: 'https://app.example.com',
    });

    await app.inject({
      method: 'POST',
      url: '/audits/audit-456/email',
      body: { email: 'user@example.com' },
    });

    expect(upsertUser).toHaveBeenCalledWith('user@example.com');
    expect(saveMagicLink).toHaveBeenCalledWith(
      'u42',
      'myhash',
      expect.any(Date)
    );

    expect(sendResultsMagicLinkEmail).toHaveBeenCalledOnce();
    const [emailArg, linkArg] = sendResultsMagicLinkEmail.mock.calls[0];
    expect(emailArg).toBe('user@example.com');
    expect(linkArg).toContain(
      'https://app.example.com/auth/verify?token=mytoken'
    );
    expect(linkArg).toContain(encodeURIComponent('/audits/audit-456/results'));
  });

  it('links the audit to the user after email submission', async () => {
    const linkAuditToUser = vi.fn().mockResolvedValue(true);
    const upsertUser = vi
      .fn()
      .mockResolvedValue({ id: 'u99', email: 'user@example.com' });
    const app = buildApp({ upsertUser, linkAuditToUser });
    await app.inject({
      method: 'POST',
      url: '/audits/audit-789/email',
      body: { email: 'user@example.com' },
    });
    expect(linkAuditToUser).toHaveBeenCalledWith('audit-789', 'u99');
  });

  it('increments audit count when audit is newly linked', async () => {
    const linkAuditToUser = vi.fn().mockResolvedValue(true);
    const incrementUserAuditCount = vi.fn().mockResolvedValue(undefined);
    const upsertUser = vi
      .fn()
      .mockResolvedValue({ id: 'u99', email: 'user@example.com' });
    const app = buildApp({
      upsertUser,
      linkAuditToUser,
      incrementUserAuditCount,
    });
    await app.inject({
      method: 'POST',
      url: '/audits/audit-789/email',
      body: { email: 'user@example.com' },
    });
    expect(incrementUserAuditCount).toHaveBeenCalledWith('u99');
  });

  it('does not increment audit count if audit was already linked', async () => {
    const linkAuditToUser = vi.fn().mockResolvedValue(false);
    const incrementUserAuditCount = vi.fn().mockResolvedValue(undefined);
    const app = buildApp({ linkAuditToUser, incrementUserAuditCount });
    await app.inject({
      method: 'POST',
      url: '/audits/audit-789/email',
      body: { email: 'user@example.com' },
    });
    expect(incrementUserAuditCount).not.toHaveBeenCalled();
  });
});
