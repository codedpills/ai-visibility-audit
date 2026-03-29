import type { FastifyPluginAsync } from 'fastify';
import type { Recommendation } from '@repo/shared';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EmailRouteDeps {
  getAudit: (
    id: string
  ) => Promise<{ recommendations: Recommendation[] } | null>;
  saveEmail: (auditId: string, email: string) => Promise<void>;
  upsertUser: (email: string) => Promise<{ id: string; email: string }>;
  generateToken: () => string;
  hashToken: (token: string) => string;
  saveMagicLink: (
    userId: string,
    hash: string,
    expiresAt: Date
  ) => Promise<void>;
  sendResultsMagicLinkEmail: (email: string, link: string) => Promise<void>;
  /** Links the audit to the user. Returns true if newly linked, false if already linked. */
  linkAuditToUser: (auditId: string, userId: string) => Promise<boolean>;
  incrementUserAuditCount: (userId: string) => Promise<void>;
  webBaseUrl: string;
}

export const emailRoute: FastifyPluginAsync<EmailRouteDeps> = async (
  fastify,
  opts
) => {
  const {
    getAudit,
    saveEmail,
    upsertUser,
    generateToken,
    hashToken,
    saveMagicLink,
    sendResultsMagicLinkEmail,
    linkAuditToUser,
    incrementUserAuditCount,
    webBaseUrl,
  } = opts;

  fastify.post<{ Params: { id: string }; Body: { email?: string } }>(
    '/audits/:id/email',
    async (request, reply) => {
      const { email } = request.body ?? {};

      if (!email || !EMAIL_RE.test(email)) {
        return reply
          .status(400)
          .send({ error: 'A valid email address is required.' });
      }

      const audit = await getAudit(request.params.id);
      if (!audit) {
        return reply.status(404).send({ error: 'Audit not found.' });
      }

      await saveEmail(request.params.id, email);

      // Upsert user + create magic link that redirects back to this audit's results
      const user = await upsertUser(email);

      // Link the anonymous audit to this user (idempotent — only updates if user_id IS NULL)
      const linked = await linkAuditToUser(request.params.id, user.id);
      if (linked) {
        await incrementUserAuditCount(user.id);
      }

      const token = generateToken();
      const hash = hashToken(token);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await saveMagicLink(user.id, hash, expiresAt);

      const redirect = encodeURIComponent(
        `/audits/${request.params.id}/results`
      );
      const link = `${webBaseUrl}/auth/verify?token=${token}&redirect=${redirect}`;
      await sendResultsMagicLinkEmail(email, link);

      return reply.status(201).send({ recommendations: audit.recommendations });
    }
  );
};
