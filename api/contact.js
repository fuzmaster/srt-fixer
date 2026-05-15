const RESEND_API_URL = "https://api.resend.com/emails";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function emailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.CONTACT_EMAIL_FROM || process.env.LICENSE_EMAIL_FROM || "SRT Fixer <onboarding@resend.dev>",
    to: process.env.CONTACT_EMAIL_TO || process.env.LICENSE_EMAIL_REPLY_TO,
    replyToFallback: process.env.CONTACT_EMAIL_REPLY_TO || process.env.LICENSE_EMAIL_REPLY_TO,
  };
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const { name, email, topic, message } = body;
  const cleanName = String(name || "").trim().slice(0, 120);
  const cleanEmail = String(email || "").trim().slice(0, 180);
  const cleanTopic = String(topic || "General question").trim().slice(0, 120);
  const cleanMessage = String(message || "").trim().slice(0, 4000);

  if (!cleanName || !validEmail(cleanEmail) || cleanMessage.length < 10) {
    return res.status(400).json({ error: "Please include your name, email, and a short message." });
  }

  const { apiKey, from, to, replyToFallback } = emailConfig();
  if (!apiKey || !to) {
    return res.status(500).json({ error: "Contact email is not configured yet." });
  }

  const html = `
    <div style="margin:0;padding:0;background:#08080a;color:#e8e8ee;font-family:Arial,Helvetica,sans-serif">
      <div style="max-width:640px;margin:0 auto;padding:28px 18px">
        <div style="border:1px solid #252530;border-radius:14px;background:#141418;overflow:hidden">
          <div style="height:3px;background:#34d399"></div>
          <div style="padding:24px">
            <div style="margin-bottom:18px">
              <span style="display:inline-block;background:#34d399;color:#000;font-family:Consolas,Monaco,monospace;font-size:11px;font-weight:800;padding:4px 8px;border-radius:5px">.srt</span>
              <span style="font-family:Consolas,Monaco,monospace;font-size:13px;font-weight:700;color:#e8e8ee;margin-left:8px">SRT Fixer Contact</span>
            </div>
            <h1 style="font-size:24px;line-height:1.2;margin:0 0 14px;color:#f4f4f5">${escapeHtml(cleanTopic)}</h1>
            <p style="font-size:14px;color:#a0a0b0;line-height:1.6;margin:0 0 18px">
              From <strong style="color:#e8e8ee">${escapeHtml(cleanName)}</strong> &lt;${escapeHtml(cleanEmail)}&gt;
            </p>
            <div style="white-space:pre-wrap;font-size:15px;line-height:1.65;color:#e8e8ee;border:1px solid #252530;border-radius:10px;background:#0e0e12;padding:18px">${escapeHtml(cleanMessage)}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const payload = {
    from,
    to: [to],
    subject: `SRT Fixer contact: ${cleanTopic}`,
    html,
    text: `From: ${cleanName} <${cleanEmail}>\nTopic: ${cleanTopic}\n\n${cleanMessage}`,
    reply_to: cleanEmail || replyToFallback,
  };

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return res.status(502).json({ error: data?.message || "Message could not be sent." });
  }

  return res.status(200).json({ ok: true });
}
