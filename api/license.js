export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body ?? {};
  const { action, license_key, instance_id, instance_name } = body;

  if (!license_key || typeof license_key !== "string") {
    return res.status(400).json({ error: "license_key required" });
  }
  if (!["activate", "validate", "deactivate"].includes(action)) {
    return res.status(400).json({ error: "Invalid action" });
  }

  const params = new URLSearchParams({ license_key: license_key.trim() });
  if (instance_id) params.append("instance_id", String(instance_id));
  if (instance_name) params.append("instance_name", String(instance_name));

  try {
    const upstream = await fetch(
      `https://api.lemonsqueezy.com/v1/licenses/${action}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      }
    );
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch {
    return res.status(502).json({ error: "License service unavailable. Try again." });
  }
}
