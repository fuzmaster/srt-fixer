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
    <div style="margin:0;padding:0;background:#08080a;color:#e8e8ee;font-family:Arial,Helvetica,sans-serif">
      <div style="max-width:640px;margin:0 auto;padding:32px 18px">
        <div style="border:1px solid #252530;border-radius:14px;overflow:hidden;background:#141418">
          <div style="height:3px;background:#34d399"></div>
          <div style="padding:28px 24px 20px;background:linear-gradient(180deg,rgba(52,211,153,.08),rgba(20,20,24,0))">
            <div style="margin-bottom:22px">
              <span style="display:inline-block;background:#34d399;color:#000;font-family:Consolas,Monaco,monospace;font-size:11px;font-weight:800;letter-spacing:.6px;padding:4px 8px;border-radius:5px">.srt</span>
              <span style="font-family:Consolas,Monaco,monospace;font-size:13px;font-weight:700;color:#e8e8ee;margin-left:8px">SRT Fixer Pro</span>
            </div>

            <h1 style="font-size:28px;line-height:1.15;margin:0 0 12px;color:#f4f4f5">Your Pro license is ready</h1>
            <p style="font-size:15px;line-height:1.6;color:#a0a0b0;margin:0">
              Thanks for buying SRT Fixer Pro. Save this key to activate batch cleanup and timing tools on another browser or device.
            </p>
          </div>

          <div style="padding:0 24px 28px">
            <div style="margin:4px 0 22px;padding:18px;border:1px solid rgba(52,211,153,.35);background:rgba(52,211,153,.08);border-radius:10px">
              <div style="font-family:Consolas,Monaco,monospace;font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#34d399;margin-bottom:10px">License Key</div>
              <div style="font-family:Consolas,Monaco,monospace;font-size:20px;line-height:1.45;font-weight:800;letter-spacing:1px;color:#e8fff6;word-break:break-all">
                ${safeKey}
              </div>
            </div>

            <div style="display:block;border:1px solid #252530;border-radius:10px;background:#0e0e12;padding:18px;margin-bottom:18px">
              <div style="font-size:14px;font-weight:700;color:#f4f4f5;margin-bottom:8px">How to activate</div>
              <ol style="margin:0;padding-left:20px;color:#a0a0b0;font-size:14px;line-height:1.7">
                <li>Open SRT Fixer.</li>
                <li>Choose <strong style="color:#e8e8ee">BatchPro</strong>.</li>
                <li>Paste this license key and click <strong style="color:#e8e8ee">Activate</strong>.</li>
              </ol>
            </div>

            <p style="font-size:13px;line-height:1.6;color:#606070;margin:0">
              Keep this email. Your license supports up to 3 active browser/device activations. Files still process locally in your browser.
            </p>
          </div>
        </div>

        <p style="font-family:Consolas,Monaco,monospace;font-size:11px;line-height:1.6;color:#606070;text-align:center;margin:18px 0 0">
          SRT Fixer · Clean subtitle files for Reels, Shorts, and podcast clips
        </p>
      </div>
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
