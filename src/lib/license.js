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
  const res = await fetch("/api/license", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export async function activateLicense(key) {
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

export async function validateLicense(key, instanceId) {
  const params = { license_key: key };
  if (instanceId) params.instance_id = instanceId;
  const data = await callAPI("validate", params);
  return data.valid === true;
}

export async function deactivateLicense(key, instanceId) {
  const params = { license_key: key };
  if (instanceId) params.instance_id = instanceId;
  await callAPI("deactivate", params);
  clearLicense();
}
