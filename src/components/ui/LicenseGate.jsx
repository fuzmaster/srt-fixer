import React, { useState } from "react";
import { activateLicense } from "../../lib/license";

const ILock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const CHECKOUT_URL =
  import.meta.env.VITE_STRIPE_CHECKOUT_URL ||
  import.meta.env.VITE_LS_CHECKOUT_URL ||
  "#";

export default function LicenseGate({ onActivated }) {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState("idle");
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
      <div className="license-gate-head">
        <div className="license-gate-icon"><ILock /></div>
        <div>
          <div className="license-gate-kicker">BatchPro</div>
          <h3 className="license-gate-title">Unlock SRT Fixer Pro</h3>
        </div>
      </div>

      <p className="license-gate-copy">
        Batch process up to 50 .srt files, download a ZIP, and use timing tools for project framerates.
      </p>

      <div className="license-gate-actions">
        <a href={CHECKOUT_URL} className="license-buy-link" target="_blank" rel="noopener noreferrer">
          Buy Pro — $9.99 one-time
        </a>
        <span className="license-gate-note">Stripe checkout returns here and creates your license key.</span>
      </div>

      <div className="license-activate-panel">
        <label className="license-input-label" htmlFor="pro-license-key">Already bought Pro?</label>
        <div className="license-input-row">
          <input
            id="pro-license-key"
            type="text"
            className={`license-input ${status === "error" ? "is-error" : ""}`}
            placeholder="SRT-XXXXXX-XXXXXX-XXXXXX-XXXXXX"
            value={key}
            onChange={(e) => { setKey(e.target.value); if (status === "error") setStatus("idle"); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleActivate(); }}
            disabled={status === "loading"}
            spellCheck={false}
            autoComplete="off"
          />
          <button
            className="license-activate-btn"
            onClick={handleActivate}
            disabled={status === "loading" || !key.trim()}
          >
            {status === "loading" ? "Activating..." : "Activate"}
          </button>
        </div>
        {status === "error" && (
          <p className="license-error-msg">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
