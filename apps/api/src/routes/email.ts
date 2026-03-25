import type { FastifyPluginAsync } from 'fastify';
import type { Recommendation } from '@repo/shared';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EmailRouteDeps {
  getAudit: (
    id: string
  ) => Promise<{ recommendations: Recommendation[] } | null>;
  saveEmail: (auditId: string, email: string) => Promise<void>;
  sendConfirmationEmail: (email: string, auditId: string) => Promise<void>;
}

export const emailRoute: FastifyPluginAsync<EmailRouteDeps> = async (
  fastify,
  opts
) => {
  const { getAudit, saveEmail, sendConfirmationEmail } = opts;

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
      await sendConfirmationEmail(email, request.params.id);

      return reply.status(201).send({ recommendations: audit.recommendations });
    }
  );
};
