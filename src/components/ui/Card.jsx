import React from "react";

export default function Card({ icon, title, desc }) {
  return (
    <div className="card-tile">
      <div className="card-icon">{icon}</div>
      <div className="card-title">{title}</div>
      <div className="card-desc">{desc}</div>
    </div>
  );
}
