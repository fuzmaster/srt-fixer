import React, { useState } from "react";
import { activateLicense } from "../../lib/license";

const ILock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

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
        Batch processing, ZIP export, and project framerate timing tools are planned for Pro. The free single-file cleaner is open for public testing now.
      </p>

      <div className="license-gate-actions">
        <span className="license-coming-soon">Pro coming soon</span>
        <span className="license-gate-note">Use the free cleaner now. If you already have a test license, you can still activate it below.</span>
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
