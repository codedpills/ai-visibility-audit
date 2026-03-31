import { Resend } from 'resend';

export interface EmailService {
  sendResultsMagicLinkEmail: (email: string, link: string) => Promise<void>;
  sendMagicLinkEmail?: (email: string, link: string) => Promise<void>;
}

// ─── Shared HTML template helpers ─────────────────────────────────────────────

function emailWrapper(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    body { margin: 0; padding: 0; background-color: #0a0a0a; }
    a { color: #9E72C3; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding: 0 16px !important; }
      .email-card { padding: 28px 20px !important; }
      .cta-button { display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0a0a0a"
    style="background-color:#0a0a0a;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Container -->
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0"
          style="max-width:600px;width:100%;">

          <!-- Header / Brand -->
          <tr>
            <td style="padding-bottom:28px;text-align:center;">
              <span style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;
                letter-spacing:0.04em;color:#888888;text-transform:uppercase;">
                AI Visibility Audit
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="email-card" bgcolor="#111111"
              style="background-color:#111111;border-radius:12px;padding:40px 36px;
                border:1px solid #2a2a2a;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#555555;line-height:1.6;">
                © ${new Date().getFullYear()} AI Visibility Audit &nbsp;·&nbsp;
                <a href="https://aivisibilityaudit.cc" style="color:#555555;text-decoration:none;">aivisibilityaudit.cc</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
    <tr>
      <td align="center" style="border-radius:8px;
        background:linear-gradient(135deg,#4A2574,#9E72C3);">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml"
          href="${href}"
          style="height:48px;v-text-anchor:middle;width:240px;"
          arcsize="17%"
          fillcolor="#6b3fa0"
          strokecolor="#6b3fa0">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:Helvetica,sans-serif;font-size:15px;font-weight:bold;">
            ${label}
          </center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${href}" class="cta-button"
          style="display:inline-block;padding:14px 32px;font-family:Inter,Helvetica,Arial,sans-serif;
            font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;
            border-radius:8px;line-height:1;letter-spacing:0.01em;white-space:nowrap;">
          ${label}
        </a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>`;
}

function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr>
      <td style="border-top:1px solid #2a2a2a;"></td>
    </tr>
  </table>`;
}

// ─── Email templates ───────────────────────────────────────────────────────────

function resultsEmailHtml(link: string): string {
  const body = `
    <!-- Icon / Badge -->
    <p style="margin:0 0 20px;text-align:center;">
      <span style="display:inline-block;background:linear-gradient(135deg,#4A2574,#9E72C3);
        border-radius:50%;width:52px;height:52px;line-height:52px;font-size:24px;text-align:center;">
        📊
      </span>
    </p>

    <!-- Headline -->
    <h1 style="margin:0 0 12px;font-family:Inter,Helvetica,Arial,sans-serif;
      font-size:24px;font-weight:700;color:#ffffff;text-align:center;line-height:1.3;">
      Your full report is ready
    </h1>

    <!-- Subtext -->
    <p style="margin:0;font-size:15px;color:#888888;text-align:center;line-height:1.7;">
      Your AI Visibility Audit is complete. Click below to see your full<br />
      GEO score, category breakdown, and all recommendations.
    </p>

    <!-- CTA -->
    ${ctaButton(link, 'View my full report →')}

    ${divider()}

    <!-- Details list -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:6px 0;">
          <span style="color:#4A2574;font-size:14px;margin-right:8px;">✓</span>
          <span style="color:#888888;font-size:14px;">All recommendations with code examples</span>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;">
          <span style="color:#4A2574;font-size:14px;margin-right:8px;">✓</span>
          <span style="color:#888888;font-size:14px;">Full category-by-category breakdown</span>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;">
          <span style="color:#4A2574;font-size:14px;margin-right:8px;">✓</span>
          <span style="color:#888888;font-size:14px;">Downloadable PDF report</span>
        </td>
      </tr>
    </table>

    ${divider()}

    <!-- Expiry notice -->
    <p style="margin:0;font-size:12px;color:#555555;text-align:center;line-height:1.6;">
      This link logs you in automatically and expires in&nbsp;<strong style="color:#888888;">15 minutes</strong>.<br />
      If you didn't request this, you can safely ignore this email.
    </p>
  `;
  return emailWrapper(body);
}

function loginEmailHtml(link: string): string {
  const body = `
    <!-- Icon / Badge -->
    <p style="margin:0 0 20px;text-align:center;">
      <span style="display:inline-block;background:linear-gradient(135deg,#4A2574,#9E72C3);
        border-radius:50%;width:52px;height:52px;line-height:52px;font-size:24px;text-align:center;">
        🔐
      </span>
    </p>

    <!-- Headline -->
    <h1 style="margin:0 0 12px;font-family:Inter,Helvetica,Arial,sans-serif;
      font-size:24px;font-weight:700;color:#ffffff;text-align:center;line-height:1.3;">
      Your login link
    </h1>

    <!-- Subtext -->
    <p style="margin:0;font-size:15px;color:#888888;text-align:center;line-height:1.7;">
      Click the button below to log in to AI Visibility Audit.<br />
      No password needed — the link works just once.
    </p>

    <!-- CTA -->
    ${ctaButton(link, 'Log in →')}

    ${divider()}

    <!-- Expiry notice -->
    <p style="margin:0;font-size:12px;color:#555555;text-align:center;line-height:1.6;">
      This link expires in&nbsp;<strong style="color:#888888;">15 minutes</strong>.<br />
      If you didn't request this, you can safely ignore this email.
    </p>
  `;
  return emailWrapper(body);
}

// ─── Service factory ───────────────────────────────────────────────────────────

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
        html: resultsEmailHtml(link),
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
        html: loginEmailHtml(link),
      });
      if (error) {
        throw new Error(error.message);
      }
    },
  };
}
