import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { kofiRoute } from './kofi.js';

const VERIFICATION_TOKEN = 'test-kofi-token';
const mockFindUserByEmail = vi.fn();
const mockRecordDonation = vi.fn();

function encodeKofiData(data: Record<string, unknown>) {
  return `data=${encodeURIComponent(JSON.stringify(data))}`;
}

async function buildApp() {
  const app = Fastify({ logger: false });
  app.register(kofiRoute, {
    findUserByEmail: mockFindUserByEmail,
    recordDonation: mockRecordDonation,
    verificationToken: VERIFICATION_TOKEN,
    db: {} as never,
  });
  await app.ready();
  return app;
}

describe('POST /webhooks/kofi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when verification token does not match', async () => {
    const app = await buildApp();
    const body = encodeKofiData({
      verification_token: 'wrong-token',
      email: 'donor@example.com',
      amount: '3.00',
    });
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/kofi',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    expect(res.statusCode).toBe(400);
  });

  it('records donation points when user is found', async () => {
    const fakeUser = { id: 'user-1', email: 'donor@example.com' };
    mockFindUserByEmail.mockResolvedValue(fakeUser);
    mockRecordDonation.mockResolvedValue(undefined);

    const app = await buildApp();
    const body = encodeKofiData({
      verification_token: VERIFICATION_TOKEN,
      email: 'donor@example.com',
      amount: '5.00',
    });
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/kofi',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    expect(res.statusCode).toBe(200);
    expect(mockFindUserByEmail).toHaveBeenCalledWith(
      expect.anything(),
      'donor@example.com'
    );
    expect(mockRecordDonation).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      5
    );
  });

  it('still returns 200 (no retry) when user is not found', async () => {
    mockFindUserByEmail.mockResolvedValue(null);

    const app = await buildApp();
    const body = encodeKofiData({
      verification_token: VERIFICATION_TOKEN,
      email: 'unknown@example.com',
      amount: '3.00',
    });
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/kofi',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    expect(res.statusCode).toBe(200);
    expect(mockFindUserByEmail).toHaveBeenCalledWith(
      expect.anything(),
      'unknown@example.com'
    );
    expect(mockRecordDonation).not.toHaveBeenCalled();
  });

  it('awards floor(amount) points (e.g. $5.75 → 5 points)', async () => {
    const fakeUser = { id: 'user-1', email: 'donor@example.com' };
    mockFindUserByEmail.mockResolvedValue(fakeUser);
    mockRecordDonation.mockResolvedValue(undefined);

    const app = await buildApp();
    const body = encodeKofiData({
      verification_token: VERIFICATION_TOKEN,
      email: 'donor@example.com',
      amount: '5.75',
    });
    await app.inject({
      method: 'POST',
      url: '/webhooks/kofi',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    expect(mockRecordDonation).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      5
    );
  });

  it('returns 400 and does not call findUser when amount is NaN', async () => {
    const app = await buildApp();
    const body = encodeKofiData({
      verification_token: VERIFICATION_TOKEN,
      email: 'donor@example.com',
      amount: 'NaN',
    });
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/kofi',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    expect(res.statusCode).toBe(400);
    expect(mockFindUserByEmail).not.toHaveBeenCalled();
  });

  it('returns 400 and does not call findUser when amount is negative', async () => {
    const app = await buildApp();
    const body = encodeKofiData({
      verification_token: VERIFICATION_TOKEN,
      email: 'donor@example.com',
      amount: '-5.00',
    });
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/kofi',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    expect(res.statusCode).toBe(400);
    expect(mockFindUserByEmail).not.toHaveBeenCalled();
  });

  it('returns 400 when email field is missing', async () => {
    const app = await buildApp();
    const body = encodeKofiData({
      verification_token: VERIFICATION_TOKEN,
      amount: '5.00',
    });
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/kofi',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    expect(res.statusCode).toBe(400);
  });
});
