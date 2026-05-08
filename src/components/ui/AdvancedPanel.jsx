import React, { useState } from "react";
import Chk from "./Chk";

export default function AdvancedPanel({ opts, setOpts }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="adv-wrap">
      <button
        onClick={() => setOpen(!open)}
        className="adv-toggle"
      >
        <span className={`adv-caret ${open ? "is-open" : ""}`}>
          ▸
        </span>
        Advanced
      </button>
      {open && (
        <div className="adv-panel">
          <label className="adv-label-group">
            Max chars / line ({opts.maxCharsPerLine})
            <input
              type="range"
              min="20"
              max="80"
              value={opts.maxCharsPerLine}
              className="adv-range"
              onChange={(e) =>
                setOpts((o) => ({ ...o, maxCharsPerLine: Number(e.target.value), platform: "" }))
              }
            />
          </label>
          <label className="adv-label-group">
            Min cue duration ({Number(opts.minCueSeconds).toFixed(1)}s)
            <input
              type="range"
              min="0.3"
              max="3"
              step="0.1"
              value={opts.minCueSeconds}
              className="adv-range"
              onChange={(e) =>
                setOpts((o) => ({ ...o, minCueSeconds: Number(e.target.value), platform: "" }))
              }
            />
          </label>
          <div className="adv-label-group">
            Punctuation detail
            <Chk
              id="adv-p"
              label="Periods"
              checked={opts.removePeriods}
              onChange={() =>
                setOpts((o) => ({ ...o, removePeriods: !o.removePeriods, platform: "" }))
              }
            />
            <Chk
              id="adv-c"
              label="Commas"
              checked={opts.removeCommas}
              onChange={() =>
                setOpts((o) => ({ ...o, removeCommas: !o.removeCommas, platform: "" }))
              }
            />
            <Chk
              id="adv-q"
              label="Question marks"
              checked={opts.removeQuestions}
              onChange={() =>
                setOpts((o) => ({ ...o, removeQuestions: !o.removeQuestions, platform: "" }))
              }
            />
            <Chk
              id="adv-e"
              label="Exclamation marks"
              checked={opts.removeExclamations}
              onChange={() =>
                setOpts((o) => ({ ...o, removeExclamations: !o.removeExclamations, platform: "" }))
              }
            />
          </div>
          <div className="adv-label-group">
            Other
            <Chk
              id="adv-sp"
              label="Strip extra spaces"
              checked={opts.stripSpaces}
              onChange={() => setOpts((o) => ({ ...o, stripSpaces: !o.stripSpaces, platform: "" }))}
            />
            <Chk
              id="adv-sl"
              label="Force single line"
              checked={opts.singleLine}
              onChange={() => setOpts((o) => ({ ...o, singleLine: !o.singleLine, platform: "" }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
