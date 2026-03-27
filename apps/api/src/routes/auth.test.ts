import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildAuthServer } from './auth.js';

const JWT_SECRET = 'test-secret-at-least-32-chars-long!!';

const mockUpsertUser = vi.fn();
const mockFindUserById = vi.fn();
const mockSaveMagicLink = vi.fn();
const mockVerifyMagicLink = vi.fn();
const mockSendMagicLinkEmail = vi.fn();
const mockGenerateMagicToken = vi.fn(() => 'raw-token-abc');
const mockHashToken = vi.fn(() => 'hashed-token-abc');

function makeDeps() {
  return {
    upsertUser: mockUpsertUser,
    findUserById: mockFindUserById,
    saveMagicLink: mockSaveMagicLink,
    verifyMagicLink: mockVerifyMagicLink,
    sendMagicLinkEmail: mockSendMagicLinkEmail,
    generateToken: mockGenerateMagicToken,
    hashToken: mockHashToken,
    jwtSecret: JWT_SECRET,
    monthlyLimit: 3,
  };
}

const fakeUser = {
  id: 'user-1',
  email: 'test@example.com',
  audits_this_month: 1,
  month_reset_at: new Date(),
  donated: false,
  donation_points: 0,
  plan: 'free' as const,
  magic_link_token_hash: null,
  magic_link_expires_at: null,
  created_at: new Date(),
};

describe('auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/magic-link', () => {
    it('returns 400 for invalid email', async () => {
      const app = await buildAuthServer(makeDeps());
      const res = await app.inject({
        method: 'POST',
        url: '/auth/magic-link',
        body: { email: 'not-an-email' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('upserts user, saves link, sends email and returns 200', async () => {
      mockUpsertUser.mockResolvedValue(fakeUser);
      mockSaveMagicLink.mockResolvedValue(undefined);
      mockSendMagicLinkEmail.mockResolvedValue(undefined);

      const app = await buildAuthServer(makeDeps());
      const res = await app.inject({
        method: 'POST',
        url: '/auth/magic-link',
        body: { email: 'test@example.com' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json<{ message: string }>();
      expect(body.message).toMatch(/check your/i);
      expect(mockUpsertUser).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com'
      );
      expect(mockSaveMagicLink).toHaveBeenCalled();
      expect(mockSendMagicLinkEmail).toHaveBeenCalledWith(
        'test@example.com',
        'raw-token-abc'
      );
    });
  });

  describe('GET /auth/verify', () => {
    it('returns 400 when token param is missing', async () => {
      const app = await buildAuthServer(makeDeps());
      const res = await app.inject({ method: 'GET', url: '/auth/verify' });
      expect(res.statusCode).toBe(400);
    });

    it('returns 401 when token is invalid or expired', async () => {
      mockVerifyMagicLink.mockResolvedValue(null);

      const app = await buildAuthServer(makeDeps());
      const res = await app.inject({
        method: 'GET',
        url: '/auth/verify?token=bad-token',
      });
      expect(res.statusCode).toBe(401);
    });

    it('sets session cookie and returns 200 on valid token', async () => {
      mockHashToken.mockReturnValue('hashed-token');
      mockVerifyMagicLink.mockResolvedValue(fakeUser);

      const app = await buildAuthServer(makeDeps());
      const res = await app.inject({
        method: 'GET',
        url: '/auth/verify?token=valid-token',
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  describe('GET /auth/me', () => {
    it('returns 401 when no session cookie', async () => {
      const app = await buildAuthServer(makeDeps());
      const res = await app.inject({ method: 'GET', url: '/auth/me' });
      expect(res.statusCode).toBe(401);
    });

    it('returns user data when authenticated', async () => {
      mockHashToken.mockReturnValue('hashed-token');
      mockVerifyMagicLink.mockResolvedValue(fakeUser);
      mockFindUserById.mockResolvedValue(fakeUser);

      const app = await buildAuthServer(makeDeps());

      // First get a cookie via verify
      const verifyRes = await app.inject({
        method: 'GET',
        url: '/auth/verify?token=valid-token',
      });
      const cookie = verifyRes.headers['set-cookie'] as string;

      const meRes = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { cookie },
      });
      expect(meRes.statusCode).toBe(200);
      const body = meRes.json<{ email: string; monthlyLimit: number }>();
      expect(body.email).toBe('test@example.com');
      expect(body.monthlyLimit).toBe(3);
    });
  });

  describe('POST /auth/logout', () => {
    it('clears session cookie and returns 200', async () => {
      const app = await buildAuthServer(makeDeps());
      const res = await app.inject({ method: 'POST', url: '/auth/logout' });
      expect(res.statusCode).toBe(200);
      // Cookie should be cleared (max-age=0 or expires in past)
      const setCookie = res.headers['set-cookie'] as string;
      expect(setCookie).toBeDefined();
      expect(setCookie).toMatch(/session=;|Max-Age=0|Expires=/i);
    });
  });
});
