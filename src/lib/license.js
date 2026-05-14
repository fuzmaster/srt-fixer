const STORAGE_KEY = "srt-fixer-pro";

export function getLicense() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLicense(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearLicense() {
  localStorage.removeItem(STORAGE_KEY);
}

async function callAPI(action, params) {
  let res;
  try {
    res = await fetch("/api/license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...params }),
    });
  } catch {
    throw new Error("License service unavailable. Check your connection and try again.");
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => ({}))
    : {};

  if (!res.ok) {
    throw new Error(data.error || "License request failed. Please try again.");
  }
  return data;
}

export async function activateLicense(key) {
  if (key?.startsWith("cs_")) return activateStripeSession(key);

  const data = await callAPI("activate", {
    license_key: key,
    instance_name: "browser",
  });

  if (!data.activated) {
    throw new Error(data.error || "License key is invalid or already used on too many devices.");
  }

  const stored = {
    key,
    instanceId: data.instance?.id ?? null,
    activatedAt: new Date().toISOString(),
    customerEmail: data.meta?.customer_email ?? null,
  };
  saveLicense(stored);
  return stored;
}

export async function activateStripeSession(sessionId) {
  const data = await callAPI("activate_stripe_session", {
    session_id: sessionId,
  });

  if (!data.activated) {
    throw new Error(data.error || "Payment could not be verified.");
  }

  const stored = {
    provider: "stripe",
    key: sessionId,
    sessionId,
    activatedAt: new Date().toISOString(),
    customerEmail: data.customerEmail ?? null,
  };
  saveLicense(stored);
  return stored;
}

export async function validateLicense(key, instanceId) {
  if (key?.startsWith("cs_")) {
    const data = await callAPI("validate_stripe_session", { session_id: key });
    return data.valid === true;
  }

  const params = { license_key: key };
  if (instanceId) params.instance_id = instanceId;
  const data = await callAPI("validate", params);
  return data.valid === true;
}

export async function deactivateLicense(key, instanceId) {
  if (key?.startsWith("cs_")) {
    clearLicense();
    return;
  }

  const params = { license_key: key };
  if (instanceId) params.instance_id = instanceId;
  await callAPI("deactivate", params);
  clearLicense();
}
