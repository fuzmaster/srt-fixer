import React from "react";

const CHECK_ICON = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2.5 6.5 5 9 9.5 3" />
  </svg>
);

export default function Chk({ label, checked, onChange, id }) {

  return (
    <label
      htmlFor={id}
      className={`chk-label ${checked ? "is-checked" : ""}`}
    >
      <input
        className="chk-input"
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
      />
      <span
        className={`chk-box ${checked ? "is-checked" : ""}`}
      >
        {checked && CHECK_ICON}
      </span>
      {label}
    </label>
  );
}
