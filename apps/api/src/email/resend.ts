import { Resend } from 'resend';

export interface EmailService {
  sendConfirmationEmail: (email: string, auditId: string) => Promise<void>;
  sendMagicLinkEmail?: (email: string, link: string) => Promise<void>;
}

export function createEmailService(
  apiKey: string,
  baseUrl: string
): EmailService {
  const resend = new Resend(apiKey);
  const fromEmail = process.env.FROM_EMAIL ?? 'onboarding@resend.dev';
  const from = `AI Visibility Audit <${fromEmail}>`;

  return {
    async sendConfirmationEmail(email: string, auditId: string) {
      const resultsUrl = `${baseUrl}/audits/${auditId}/results`;
      const { error } = await resend.emails.send({
        from,
        to: email,
        subject: 'Your AI Visibility Audit Results',
        html: `
          <h1>Your audit results are ready</h1>
          <p>View your full AI Visibility Audit report here:</p>
          <p><a href="${resultsUrl}">${resultsUrl}</a></p>
          <p>Your results will be available for 7 days.</p>
          <hr />
          <p><small>Upgrade to Pro for permanent access and PDF reports.</small></p>
        `,
      });
      if (error) {
        throw new Error(error.message);
      }
    },
    async sendMagicLinkEmail(email: string, link: string) {
      const { error } = await resend.emails.send({
        from,
        to: email,
        subject: 'Your AI Visibility Audit login link',
        html: `
          <h1>Log in to AI Visibility Audit</h1>
          <p>Click the link below to log in. It expires in 15 minutes.</p>
          <p><a href="${link}">${link}</a></p>
          <p><small>If you didn't request this, you can ignore this email.</small></p>
        `,
      });
      if (error) {
        throw new Error(error.message);
      }
    },
  };
}
