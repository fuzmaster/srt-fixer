import crypto from "node:crypto";

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

  // Stripe is the source of truth for this DB-free MVP. License validation
  // retrieves Checkout Sessions directly, so webhooks are observed for audit.
  console.info("Stripe webhook received", {
    type: event.type,
    id: event.id,
    objectId: event.data?.object?.id || null,
  });

  return res.status(200).json({ ok: true });
}
