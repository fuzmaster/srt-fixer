import { createManualLicense } from "./_license-store.js";
import { sendLicenseEmail } from "./_license-email.js";

function unauthorized(res) {
  return res.status(401).json({ error: "Unauthorized" });
}

function adminAllowed(req) {
  const secret = process.env.ADMIN_LICENSE_SECRET;
  if (!secret || secret.length < 24) return false;

  const auth = req.headers.authorization || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
  const headerSecret = req.headers["x-admin-secret"];
  return bearer === secret || headerSecret === secret;
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!adminAllowed(req)) return unauthorized(res);

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const customerEmail = String(body.customer_email || body.email || "").trim().toLowerCase();
  const note = String(body.note || "Manual Pro recovery").trim().slice(0, 500);
  const sendEmail = body.send_email !== false;

  if (!validEmail(customerEmail)) {
    return res.status(400).json({ error: "customer_email is required" });
  }

  try {
    const license = await createManualLicense({ customerEmail, note });
    let email = { sent: false, skipped: true };
    if (sendEmail) {
      email = await sendLicenseEmail({
        to: customerEmail,
        licenseKey: license.licenseKey,
        record: license.record,
      }).catch((err) => ({ sent: false, error: err.message }));
    }

    return res.status(200).json({
      ok: true,
      licenseKey: license.licenseKey,
      customerEmail,
      email,
    });
  } catch (err) {
    return res.status(502).json({ error: err.message || "Manual license creation failed" });
  }
}
