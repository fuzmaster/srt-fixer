import crypto from "node:crypto";
import { createClient } from "redis";

const MAX_ACTIVATIONS = 3;
let redisClient;

function storeConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const redisUrl = process.env.REDIS_URL;
  if ((!url || !token) && !redisUrl) {
    throw new Error("License storage is not configured");
  }
  return { url, token, redisUrl };
}

async function getRedisClient(redisUrl) {
  if (!redisClient) {
    redisClient = createClient({ url: redisUrl });
    redisClient.on("error", (err) => {
      console.error("Redis license storage error", err);
    });
  }
  if (!redisClient.isOpen) await redisClient.connect();
  return redisClient;
}

async function redis(command) {
  const { url, token, redisUrl } = storeConfig();

  if (redisUrl && (!url || !token)) {
    const client = await getRedisClient(redisUrl);
    const [name, key, value] = command;
    if (name === "GET") return client.get(key);
    if (name === "SET") return client.set(key, value);
    throw new Error(`Unsupported license storage command: ${name}`);
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "License storage request failed");
  return data.result;
}

function hashSecret() {
  return process.env.LICENSE_HASH_SECRET || process.env.STRIPE_SECRET_KEY || "srt-fixer";
}

export function normalizeLicenseKey(key) {
  return String(key || "").trim().toUpperCase();
}

export function hashLicenseKey(key) {
  return crypto
    .createHmac("sha256", hashSecret())
    .update(normalizeLicenseKey(key))
    .digest("hex");
}

export function generateLicenseKey() {
  const chunks = Array.from({ length: 4 }, () =>
    crypto.randomBytes(3).toString("hex").toUpperCase()
  );
  return `SRT-${chunks.join("-")}`;
}

export async function getJson(key) {
  const value = await redis(["GET", key]);
  return value ? JSON.parse(value) : null;
}

export async function setJson(key, value) {
  await redis(["SET", key, JSON.stringify(value)]);
}

export async function createLicenseFromStripeSession({ session, lineItems, licenseKey }) {
  const sessionIndex = await getJson(`stripe-session:${session.id}`);
  if (sessionIndex?.licenseKey && sessionIndex?.licenseHash) {
    const existing = await getJson(`license:${sessionIndex.licenseHash}`);
    if (existing) return { licenseKey: sessionIndex.licenseKey, record: existing };
  }

  const key = normalizeLicenseKey(licenseKey || generateLicenseKey());
  const hash = hashLicenseKey(key);
  const existing = await getJson(`license:${hash}`);
  if (existing) return { licenseKey: key, record: existing };

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;
  const latestCharge =
    typeof session.payment_intent?.latest_charge === "string"
      ? session.payment_intent.latest_charge
      : session.payment_intent?.latest_charge?.id || null;

  const record = {
    provider: "stripe",
    status: "active",
    sessionId: session.id,
    paymentIntentId,
    chargeId: latestCharge,
    customerEmail: session.customer_details?.email || session.customer_email || null,
    customerId: session.customer || null,
    lineItems: lineItems?.data?.map((item) => ({
      priceId: item.price?.id || null,
      productId: item.price?.product || null,
      description: item.description || null,
    })) || [],
    activations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setJson(`license:${hash}`, record);
  await setJson(`stripe-session:${session.id}`, { licenseKey: key, licenseHash: hash });
  if (paymentIntentId) await setJson(`stripe-payment-intent:${paymentIntentId}`, { licenseHash: hash });
  if (latestCharge) await setJson(`stripe-charge:${latestCharge}`, { licenseHash: hash });

  return { licenseKey: key, record };
}

export async function createManualLicense({ customerEmail, note, licenseKey }) {
  const key = normalizeLicenseKey(licenseKey || generateLicenseKey());
  const hash = hashLicenseKey(key);
  const existing = await getJson(`license:${hash}`);
  if (existing) return { licenseKey: key, record: existing };

  const record = {
    provider: "manual",
    status: "active",
    sessionId: `manual:${crypto.randomUUID()}`,
    paymentIntentId: null,
    chargeId: null,
    customerEmail: customerEmail || null,
    customerId: null,
    note: note || null,
    lineItems: [
      {
        priceId: process.env.STRIPE_PRO_PRICE_ID || null,
        productId: process.env.STRIPE_PRO_PRODUCT_ID || null,
        description: "SRT Fixer Pro manual license",
      },
    ],
    activations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setJson(`license:${hash}`, record);
  return { licenseKey: key, record };
}

export async function markLicenseEmailSent(licenseKey, emailId = null) {
  const hash = hashLicenseKey(licenseKey);
  const key = `license:${hash}`;
  const record = await getJson(key);
  if (!record) return null;

  const nextRecord = {
    ...record,
    licenseEmailSentAt: new Date().toISOString(),
    licenseEmailId: emailId,
    updatedAt: new Date().toISOString(),
  };
  await setJson(key, nextRecord);
  return nextRecord;
}

export async function activateStoredLicense(licenseKey, instanceName = "browser") {
  const key = normalizeLicenseKey(licenseKey);
  const hash = hashLicenseKey(key);
  const record = await getJson(`license:${hash}`);

  if (!record || record.status !== "active") {
    return { activated: false, error: "License key is invalid or inactive." };
  }

  const activations = Array.isArray(record.activations) ? record.activations : [];
  if (activations.length >= MAX_ACTIVATIONS) {
    return { activated: false, error: "License key is already active on too many devices." };
  }

  const instance = {
    id: crypto.randomUUID(),
    name: String(instanceName || "browser").slice(0, 80),
    activatedAt: new Date().toISOString(),
  };
  const nextRecord = {
    ...record,
    activations: [...activations, instance],
    updatedAt: new Date().toISOString(),
  };
  await setJson(`license:${hash}`, nextRecord);

  return {
    activated: true,
    instance,
    meta: { customer_email: record.customerEmail || null },
  };
}

export async function validateStoredLicense(licenseKey, instanceId) {
  const hash = hashLicenseKey(licenseKey);
  const record = await getJson(`license:${hash}`);
  if (!record || record.status !== "active") return { valid: false };

  if (instanceId) {
    const active = record.activations?.some((item) => item.id === instanceId);
    return { valid: Boolean(active) };
  }

  return { valid: true };
}

export async function deactivateStoredLicense(licenseKey, instanceId) {
  const hash = hashLicenseKey(licenseKey);
  const record = await getJson(`license:${hash}`);
  if (!record) return { deactivated: true };

  const activations = Array.isArray(record.activations) ? record.activations : [];
  const nextRecord = {
    ...record,
    activations: instanceId
      ? activations.filter((item) => item.id !== instanceId)
      : activations,
    updatedAt: new Date().toISOString(),
  };
  await setJson(`license:${hash}`, nextRecord);
  return { deactivated: true };
}

export async function markLicenseRefundedByPaymentIntent(paymentIntentId) {
  if (!paymentIntentId) return false;
  const index = await getJson(`stripe-payment-intent:${paymentIntentId}`);
  if (!index?.licenseHash) return false;

  const key = `license:${index.licenseHash}`;
  const record = await getJson(key);
  if (!record) return false;

  await setJson(key, {
    ...record,
    status: "refunded",
    updatedAt: new Date().toISOString(),
  });
  return true;
}
