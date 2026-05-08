import React from "react";

export default function Trust({ icon, text }) {
  return (
    <div className="trust-item">
      <span className="trust-icon">{icon}</span>
      {text}
    </div>
  );
}
