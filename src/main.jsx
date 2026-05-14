import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import SRTFixer from "./components/SRTFixer.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SRTFixer />
    <Analytics />
  </React.StrictMode>
);
