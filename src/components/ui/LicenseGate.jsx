import React, { useState } from "react";
import { activateLicense } from "../../lib/license";

const ILock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const CHECKOUT_URL = import.meta.env.VITE_LS_CHECKOUT_URL || "#";

export default function LicenseGate({ onActivated }) {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleActivate = async () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const license = await activateLicense(trimmed);
      onActivated(license);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Activation failed. Check your key and try again.");
    }
  };

  return (
    <div className="license-gate">
      <div className="license-gate-icon"><ILock /></div>
      <h3 className="license-gate-title">SRT Fixer Pro</h3>
      <p className="license-gate-copy">
        Process multiple .srt files at once — apply the same settings across an entire project in seconds. Enter your license key to activate.
      </p>
      <div className="license-input-row">
        <input
          type="text"
          className={`license-input ${status === "error" ? "is-error" : ""}`}
          placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
          value={key}
          onChange={(e) => { setKey(e.target.value); if (status === "error") setStatus("idle"); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleActivate(); }}
          disabled={status === "loading"}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          className="btn-primary"
          onClick={handleActivate}
          disabled={status === "loading" || !key.trim()}
        >
          {status === "loading" ? "Activating…" : "Activate"}
        </button>
      </div>
      {status === "error" && (
        <p className="license-error-msg">{errorMsg}</p>
      )}
      <div className="license-gate-footer">
        <a href={CHECKOUT_URL} className="license-buy-link" target="_blank" rel="noopener noreferrer">
          Get a license key — $19 one-time
        </a>
        <span className="license-gate-divider">·</span>
        <span className="license-gate-note">No subscription. Works offline after activation.</span>
      </div>
    </div>
  );
}
