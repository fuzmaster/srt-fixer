import { markLicenseEmailSent } from "./_license-store.js";

const RESEND_API_URL = "https://api.resend.com/emails";

function emailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    from:
      process.env.LICENSE_EMAIL_FROM ||
      "SRT Fixer <onboarding@resend.dev>",
    replyTo: process.env.LICENSE_EMAIL_REPLY_TO || undefined,
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function licenseEmailHtml({ licenseKey }) {
  const safeKey = escapeHtml(licenseKey);
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px">
      <h1 style="font-size:24px;margin:0 0 16px">Your SRT Fixer Pro license</h1>
      <p>Thanks for buying SRT Fixer Pro. Use this license key to activate Pro on another browser or device:</p>
      <div style="font-family:Consolas,monospace;font-size:18px;font-weight:700;letter-spacing:1px;background:#f3f4f6;border:1px solid #d1d5db;border-radius:8px;padding:14px 16px;margin:20px 0">
        ${safeKey}
      </div>
      <p>Open SRT Fixer, choose <strong>BatchPro</strong>, paste the key, and click <strong>Activate</strong>.</p>
      <p style="font-size:13px;color:#6b7280">Keep this email. Your license supports up to 3 active browser/device activations.</p>
    </div>
  `;
}

function licenseEmailText({ licenseKey }) {
  return `Thanks for buying SRT Fixer Pro.

Your license key:
${licenseKey}

Open SRT Fixer, choose BatchPro, paste the key, and click Activate.

Keep this email. Your license supports up to 3 active browser/device activations.`;
}

export async function sendLicenseEmail({ to, licenseKey, record }) {
  if (!to || !licenseKey || record?.licenseEmailSentAt) {
    return { sent: false, skipped: true };
  }

  const { apiKey, from, replyTo } = emailConfig();
  if (!apiKey) {
    console.warn("License email skipped: RESEND_API_KEY is not configured");
    return { sent: false, skipped: true };
  }

  const payload = {
    from,
    to: [to],
    subject: "Your SRT Fixer Pro license key",
    html: licenseEmailHtml({ licenseKey }),
    text: licenseEmailText({ licenseKey }),
  };
  if (replyTo) payload.reply_to = replyTo;

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "License email failed");
  }

  await markLicenseEmailSent(licenseKey, data?.id || null);
  return { sent: true, id: data?.id || null };
}
