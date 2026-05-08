import React from "react";

export default function ProRow({ label, lockIcon }) {
  return (
    <div className="pro-row">
      <span className="pro-row-lock">
        {lockIcon}
      </span>
      <span className="pro-row-label">{label}</span>
      <span className="pro-row-pill">
        PRO
      </span>
    </div>
  );
}
