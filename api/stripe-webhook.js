import crypto from "node:crypto";
import {
  createLicenseFromStripeSession,
  markLicenseRefundedByPaymentIntent,
} from "./_license-store.js";
import { sendLicenseEmail } from "./_license-email.js";

const HANDLED_EVENTS = new Set([
  "checkout.session.completed",
  "charge.refunded",
  "refund.created",
]);

function readRawBody(req) {
  if (typeof req.body === "string") return Promise.resolve(req.body);
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body.toString("utf8"));
  if (req.body && typeof req.body === "object") return Promise.resolve(JSON.stringify(req.body));

  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function parseStripeSignature(header) {
  return String(header || "")
    .split(",")
    .reduce((acc, part) => {
      const [key, value] = part.split("=");
      if (key && value) acc[key] = value;
      return acc;
    }, {});
}

function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!rawBody || !signatureHeader || !secret) return false;
  const parts = parseStripeSignature(signatureHeader);
  if (!parts.t || !parts.v1) return false;

  const signedPayload = `${parts.t}.${rawBody}`;
  const expected = Buffer.from(
    crypto.createHmac("sha256", secret).update(signedPayload).digest("hex"),
    "hex"
  );
  const received = Buffer.from(parts.v1, "hex");

  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
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

function lineItemsMatchProduct(lineItems) {
  const expectedPriceId = process.env.STRIPE_PRO_PRICE_ID;
  const expectedProductId = process.env.STRIPE_PRO_PRODUCT_ID;
  if (!expectedPriceId && !expectedProductId) return true;

  return lineItems.data?.some((item) => {
    const price = item.price || {};
    return (
      (expectedPriceId && price.id === expectedPriceId) ||
      (expectedProductId && price.product === expectedProductId)
    );
  });
}

async function handleCheckoutCompleted(session) {
  if (session.payment_status !== "paid") return;

  const lineItems = await stripeSessionLineItems(session.id);
  if (!lineItemsMatchProduct(lineItems)) return;

  const license = await createLicenseFromStripeSession({ session, lineItems });
  try {
    await sendLicenseEmail({
      to: license.record.customerEmail,
      licenseKey: license.licenseKey,
      record: license.record,
    });
  } catch (err) {
    console.error("License email failed after checkout", {
      sessionId: session.id,
      customerEmail: license.record.customerEmail,
      error: err.message,
    });
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Stripe webhook secret is not configured" });
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["stripe-signature"];
  const signatureHeader = Array.isArray(signature) ? signature[0] : signature;

  if (!verifyStripeSignature(rawBody, signatureHeader, secret)) {
    return res.status(401).json({ error: "Invalid Stripe webhook signature" });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "Invalid Stripe webhook JSON" });
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return res.status(200).json({ ok: true, ignored: true });
  }

  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(event.data?.object || {});
  }

  if (event.type === "charge.refunded") {
    await markLicenseRefundedByPaymentIntent(event.data?.object?.payment_intent);
  }

  console.info("Stripe webhook received", {
    type: event.type,
    id: event.id,
    objectId: event.data?.object?.id || null,
  });

  return res.status(200).json({ ok: true });
}
