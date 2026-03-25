import { Resend } from 'resend';

export interface EmailService {
  sendConfirmationEmail: (email: string, auditId: string) => Promise<void>;
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
  };
}
