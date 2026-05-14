import {
  activateStoredLicense,
  createLicenseFromStripeSession,
  deactivateStoredLicense,
  validateStoredLicense,
} from "./_license-store.js";

const ALLOWED_ACTIONS = new Set([
  "activate",
  "validate",
  "deactivate",
  "activate_stripe_session",
  "validate_stripe_session",
]);
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 20;
const requestBuckets = new Map();

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(key) {
  const now = Date.now();
  const bucket = requestBuckets.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  bucket.count += 1;
  requestBuckets.set(key, bucket);
  return bucket.count > RATE_LIMIT_MAX;
}

function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === req.headers.host;
  } catch {
    return false;
  }
}

async function stripeRequest(path, params = {}) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe is not configured");
  }

  const qs = new URLSearchParams(params);
  const url = `https://api.stripe.com/v1/${path}${qs.size ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || "Stripe request failed");
  }
  return data;
}

async function stripeSessionLineItems(sessionId) {
  return stripeRequest(`checkout/sessions/${encodeURIComponent(sessionId)}/line_items`, {
    limit: "10",
  });
}

async function verifyStripeSession(sessionId) {
  if (!sessionId || typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return { valid: false, error: "Invalid checkout session" };
  }

  const session = await stripeRequest(`checkout/sessions/${encodeURIComponent(sessionId)}`, {
    "expand[]": "payment_intent.latest_charge",
  });

  const charge = session.payment_intent?.latest_charge;
  const paid = session.payment_status === "paid";
  const succeeded = !session.payment_intent || session.payment_intent.status === "succeeded";
  const notRefunded = !charge || charge.refunded !== true;

  if (!paid || !succeeded || !notRefunded) {
    return { valid: false, error: "Payment is not active" };
  }

  const expectedPriceId = process.env.STRIPE_PRO_PRICE_ID;
  const expectedProductId = process.env.STRIPE_PRO_PRODUCT_ID;
  if (expectedPriceId || expectedProductId) {
    const items = await stripeSessionLineItems(sessionId);
    const matched = items.data?.some((item) => {
      const price = item.price || {};
      return (
        (expectedPriceId && price.id === expectedPriceId) ||
        (expectedProductId && price.product === expectedProductId)
      );
    });
    if (!matched) return { valid: false, error: "Payment is not for SRT Fixer Pro" };
  }

  return { valid: true, session, lineItems: await stripeSessionLineItems(sessionId) };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!originAllowed(req)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const rateLimitKey = `${clientIp(req)}:${req.body?.action || "unknown"}`;
  if (isRateLimited(rateLimitKey)) {
    return res.status(429).json({ error: "Too many attempts. Try again in a minute." });
  }

  const body = req.body ?? {};
  const { action, license_key, instance_id, instance_name, session_id } = body;

  if (!ALLOWED_ACTIONS.has(action)) {
    return res.status(400).json({ error: "Invalid action" });
  }

  if (action === "activate_stripe_session" || action === "validate_stripe_session") {
    try {
      const result = await verifyStripeSession(session_id);
      if (!result.valid) {
        return res.status(400).json({ valid: false, activated: false, error: result.error });
      }
      if (action === "validate_stripe_session") {
        return res.status(200).json({ valid: true });
      }
      const license = await createLicenseFromStripeSession({
        session: result.session,
        lineItems: result.lineItems,
      });
      const activation = await activateStoredLicense(license.licenseKey, "browser");
      return res.status(200).json({
        valid: true,
        activated: true,
        licenseKey: license.licenseKey,
        instance: activation.instance,
        customerEmail: license.record.customerEmail,
      });
    } catch (err) {
      return res.status(502).json({ error: err.message || "Stripe/license verification failed" });
    }
  }

  if (!license_key || typeof license_key !== "string") {
    return res.status(400).json({ error: "license_key required" });
  }
  try {
    if (action === "activate") {
      const result = await activateStoredLicense(license_key, instance_name);
      return res.status(result.activated ? 200 : 400).json(result);
    }
    if (action === "validate") {
      const result = await validateStoredLicense(license_key, instance_id);
      return res.status(200).json(result);
    }
    if (action === "deactivate") {
      const result = await deactivateStoredLicense(license_key, instance_id);
      return res.status(200).json(result);
    }
    return res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    return res.status(502).json({ error: err.message || "License service unavailable. Try again." });
  }
}
