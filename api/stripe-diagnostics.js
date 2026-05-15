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

function keyShape(value, expectedPrefix) {
  const text = String(value || "");
  return {
    present: Boolean(text),
    startsWithExpectedPrefix: text.startsWith(expectedPrefix),
    prefix: text ? text.slice(0, Math.min(expectedPrefix.length + 5, text.length)) : null,
    length: text.length,
  };
}

async function stripeRequest(path) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export default async function handler(req, res) {
  if (!adminAllowed(req)) return unauthorized(res);

  const sessionId = String(req.query?.session_id || "").trim();
  const diagnostics = {
    env: {
      STRIPE_SECRET_KEY: keyShape(process.env.STRIPE_SECRET_KEY, "sk_live_"),
      STRIPE_WEBHOOK_SECRET: keyShape(process.env.STRIPE_WEBHOOK_SECRET, "whsec_"),
      STRIPE_PRO_PRODUCT_ID: keyShape(process.env.STRIPE_PRO_PRODUCT_ID, "prod_"),
      STRIPE_PRO_PRICE_ID: keyShape(process.env.STRIPE_PRO_PRICE_ID, "price_"),
      RESEND_API_KEY: keyShape(process.env.RESEND_API_KEY, "re_"),
      REDIS_URL: { present: Boolean(process.env.REDIS_URL), length: String(process.env.REDIS_URL || "").length },
      LICENSE_HASH_SECRET: { present: Boolean(process.env.LICENSE_HASH_SECRET), length: String(process.env.LICENSE_HASH_SECRET || "").length },
    },
    session: null,
  };

  if (sessionId) {
    const result = await stripeRequest(`checkout/sessions/${encodeURIComponent(sessionId)}`);
    diagnostics.session = {
      requestedId: sessionId,
      ok: result.ok,
      status: result.status,
      stripeObject: result.data?.object || null,
      paymentStatus: result.data?.payment_status || null,
      mode: result.data?.mode || null,
      customerEmail: result.data?.customer_details?.email || result.data?.customer_email || null,
      error: result.data?.error?.message || null,
    };
  }

  return res.status(200).json(diagnostics);
}
