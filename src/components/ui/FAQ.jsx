import React, { useState } from "react";

export default function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="faq-item">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="faq-toggle"
      >
        {q}
        <span className={`faq-plus ${open ? "is-open" : ""}`}>
          +
        </span>
      </button>
      {open && (
        <div className="si faq-answer">
          {a}
        </div>
      )}
    </div>
  );
}
