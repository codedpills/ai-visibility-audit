import { Resend } from 'resend';

export interface EmailService {
  sendResultsMagicLinkEmail: (email: string, link: string) => Promise<void>;
  sendMagicLinkEmail?: (email: string, link: string) => Promise<void>;
}

export function createEmailService(
  apiKey: string,
  _baseUrl: string
): EmailService {
  const resend = new Resend(apiKey);
  const fromEmail = process.env.FROM_EMAIL ?? 'onboarding@resend.dev';
  const from = `AI Visibility Audit <${fromEmail}>`;

  return {
    async sendResultsMagicLinkEmail(email: string, link: string) {
      const { error } = await resend.emails.send({
        from,
        to: email,
        subject: 'Your full AI Visibility Audit report is ready →',
        html: `
          <h1>Your AI Visibility Audit report is ready</h1>
          <p>Click the link below to view your full report with all recommendations and a deep breakdown of each score.</p>
          <p><a href="${link}">View your full report →</a></p>
          <p>This link also logs you in automatically. It expires in 15 minutes.</p>
          <p><small>If you didn't request this, you can ignore this email.</small></p>
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
