import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEmailService } from './resend.js';

// vi.mock is hoisted to the top of the file, so mockSend must be declared via vi.hoisted
// to be available inside the factory function.
// Vitest 4 requires a regular `function` (not arrow) for constructor mocks.
const mockSend = vi.hoisted(() => vi.fn());
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockSend } };
  }),
}));

describe('createEmailService', () => {
  const BASE_URL = 'https://example.com';
  const AUDIT_ID = 'abc-123';
  const EMAIL = 'user@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends a results magic-link email on success', async () => {
    mockSend.mockResolvedValue({ data: { id: 'msg_1' }, error: null });
    const link = `${BASE_URL}/auth/verify?token=abc&redirect=%2Faudits%2F${AUDIT_ID}%2Fresults`;

    const svc = createEmailService('re_test_key', BASE_URL);
    await expect(
      svc.sendResultsMagicLinkEmail(EMAIL, link)
    ).resolves.not.toThrow();

    expect(mockSend).toHaveBeenCalledOnce();
    const [payload] = mockSend.mock.calls[0];
    expect(payload.to).toBe(EMAIL);
    expect(payload.html).toContain(link);
  });

  it('email subject mentions the audit report', async () => {
    mockSend.mockResolvedValue({ data: { id: 'msg_s' }, error: null });
    const link = `${BASE_URL}/auth/verify?token=xyz&redirect=%2Faudits%2Ftest%2Fresults`;
    const svc = createEmailService('re_test_key', BASE_URL);
    await svc.sendResultsMagicLinkEmail(EMAIL, link);
    const [payload] = mockSend.mock.calls[0];
    expect(payload.subject).toMatch(/report|result/i);
  });

  it('throws when Resend returns an error', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', message: 'Invalid from address' },
    });
    const link = `${BASE_URL}/auth/verify?token=xyz`;
    const svc = createEmailService('re_test_key', BASE_URL);
    await expect(svc.sendResultsMagicLinkEmail(EMAIL, link)).rejects.toThrow(
      'Invalid from address'
    );
  });

  it('uses FROM_EMAIL env var when set', async () => {
    process.env.FROM_EMAIL = 'audit@myapp.com';
    mockSend.mockResolvedValue({ data: { id: 'msg_2' }, error: null });

    const svc = createEmailService('re_test_key', BASE_URL);
    await svc.sendResultsMagicLinkEmail(
      EMAIL,
      `${BASE_URL}/auth/verify?token=t`
    );

    const [payload] = mockSend.mock.calls[0];
    expect(payload.from).toContain('audit@myapp.com');

    delete process.env.FROM_EMAIL;
  });

  it('falls back to onboarding@resend.dev when FROM_EMAIL is absent', async () => {
    delete process.env.FROM_EMAIL;
    mockSend.mockResolvedValue({ data: { id: 'msg_3' }, error: null });

    const svc = createEmailService('re_test_key', BASE_URL);
    await svc.sendResultsMagicLinkEmail(
      EMAIL,
      `${BASE_URL}/auth/verify?token=t`
    );

    const [payload] = mockSend.mock.calls[0];
    expect(payload.from).toContain('onboarding@resend.dev');
  });
});
