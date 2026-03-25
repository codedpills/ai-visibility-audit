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

function buildApp(opts: {
  getAudit?: (
    id: string
  ) => Promise<{ recommendations: Recommendation[] } | null>;
  saveEmail?: (auditId: string, email: string) => Promise<void>;
  sendConfirmationEmail?: (email: string, auditId: string) => Promise<void>;
}) {
  const app = Fastify();
  app.register(emailRoute, {
    getAudit:
      opts.getAudit ??
      vi.fn().mockResolvedValue({ recommendations: mockRecommendations }),
    saveEmail: opts.saveEmail ?? vi.fn().mockResolvedValue(undefined),
    sendConfirmationEmail:
      opts.sendConfirmationEmail ?? vi.fn().mockResolvedValue(undefined),
  });
  return app;
}

describe('POST /audits/:id/email', () => {
  it('returns 400 for missing email', async () => {
    const app = buildApp({});
    const res = await app.inject({
      method: 'POST',
      url: '/audits/abc-123/email',
      body: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const app = buildApp({});
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

  it('sends a confirmation email after saving', async () => {
    const sendConfirmationEmail = vi.fn().mockResolvedValue(undefined);
    const app = buildApp({ sendConfirmationEmail });
    await app.inject({
      method: 'POST',
      url: '/audits/audit-123/email',
      body: { email: 'user@example.com' },
    });
    expect(sendConfirmationEmail).toHaveBeenCalledWith(
      'user@example.com',
      'audit-123'
    );
  });
});
