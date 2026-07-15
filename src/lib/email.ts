import { env } from "./env";

const RESEND_URL = "https://api.resend.com/emails";

type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

/** Send a single email via Resend's REST API (works on Cloudflare Workers). */
export async function sendEmail({ to, subject, html, replyTo }: SendArgs): Promise<void> {
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env().RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env().EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend send failed (${res.status}): ${body}`);
  }
}

/**
 * Fan out a newsletter to many recipients. Resend's free tier is rate-limited,
 * so we send in small chunks with the recipients in BCC-style individual sends.
 * For larger lists, move this to a queue; for a community group it's fine.
 */
export async function sendNewsletter(
  recipients: string[],
  subject: string,
  html: string,
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  for (const email of recipients) {
    try {
      await sendEmail({ to: email, subject, html });
      sent++;
    } catch {
      failed++;
    }
  }
  return { sent, failed };
}

export function baseTemplate(title: string, bodyHtml: string, footerHtml = ""): string {
  return `<!doctype html><html><body style="margin:0;background:#fff7ed;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1c1917">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <h1 style="color:#c2410c;font-size:22px;margin:0 0 16px">${title}</h1>
    <div style="font-size:15px;line-height:1.6">${bodyHtml}</div>
    <hr style="border:none;border-top:1px solid #eee;margin:28px 0"/>
    <p style="font-size:12px;color:#78716c">${footerHtml}</p>
  </div></body></html>`;
}
