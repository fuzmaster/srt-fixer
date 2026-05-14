import React, { useState } from "react";

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

export default function LicenseGate() {
  return (
    <div className="license-gate">
      <div className="license-gate-icon"><ILock /></div>
      <h3 className="license-gate-title">SRT Fixer Pro</h3>
      <p className="license-gate-copy">
        Process multiple .srt files at once, snap captions to project framerates, and apply the same settings across an entire project in seconds.
      </p>
      <div className="license-gate-footer">
        <a href={CHECKOUT_URL} className="license-buy-link" target="_blank" rel="noopener noreferrer">
          Buy Pro — $9.99 one-time
        </a>
        <span className="license-gate-divider">·</span>
        <span className="license-gate-note">Return after checkout to unlock Pro in this browser.</span>
      </div>
    </div>
  );
}
