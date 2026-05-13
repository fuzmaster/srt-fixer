import React, { useState } from "react";
import Chk from "./Chk";

const FRAME_RATES = ["23.976", "24", "25", "29.97", "30", "50", "59.94", "60"];

export default function AdvancedPanel({ opts, setOpts, processingMode, isPro, onRequirePro }) {
  const [open, setOpen] = useState(false);
  const isClean = processingMode !== "regroup";

  return (
    <div className="adv-wrap">
      <button
        onClick={() => setOpen(!open)}
        className="adv-toggle"
        aria-expanded={open}
        aria-controls="adv-panel-content"
      >
        <span className={`adv-caret ${open ? "is-open" : ""}`}>
          ▸
        </span>
        Customize Output
      </button>
      {open && (
        <div id="adv-panel-content" className="adv-panel">
          {/* Regroup-only timing controls — hidden in Clean Text Only mode */}
          {!isClean && (
            <>
              <label className="adv-label-group">
                Max chars / line ({opts.maxCharsPerLine})
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={opts.maxCharsPerLine}
                  className="adv-range"
                  onChange={(e) =>
                    setOpts((o) => ({ ...o, maxCharsPerLine: Number(e.target.value) }))
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
                    setOpts((o) => ({ ...o, minCueSeconds: Number(e.target.value) }))
                  }
                />
              </label>
            </>
          )}
          <div className="adv-label-group">
            Punctuation detail
            <Chk
              id="adv-p"
              label="Periods"
              checked={opts.removePeriods}
              onChange={() =>
                setOpts((o) => ({ ...o, removePeriods: !o.removePeriods }))
              }
            />
            <Chk
              id="adv-c"
              label="Commas"
              checked={opts.removeCommas}
              onChange={() =>
                setOpts((o) => ({ ...o, removeCommas: !o.removeCommas }))
              }
            />
            <Chk
              id="adv-q"
              label="Question marks"
              checked={opts.removeQuestions}
              onChange={() =>
                setOpts((o) => ({ ...o, removeQuestions: !o.removeQuestions }))
              }
            />
            <Chk
              id="adv-e"
              label="Exclamation marks"
              checked={opts.removeExclamations}
              onChange={() =>
                setOpts((o) => ({ ...o, removeExclamations: !o.removeExclamations }))
              }
            />
          </div>
          <div className="adv-label-group">
            Other
            <Chk
              id="adv-sp"
              label="Strip extra spaces"
              checked={opts.stripSpaces}
              onChange={() => setOpts((o) => ({ ...o, stripSpaces: !o.stripSpaces }))}
            />
            <Chk
              id="adv-sl"
              label="Force single line"
              checked={opts.singleLine}
              onChange={() => setOpts((o) => ({ ...o, singleLine: !o.singleLine }))}
            />
          </div>
          <div className={`adv-pro-timing ${!isPro ? "is-locked" : ""}`}>
            <div className="adv-pro-head">
              <span>Pro timing</span>
              <span className="adv-pro-pill">Pro</span>
            </div>
            {!isPro ? (
              <>
                <p className="adv-pro-copy">
                  Snap cue timing to your project framerate and apply batch-safe subtitle offsets.
                </p>
                <button type="button" className="adv-pro-btn" onClick={onRequirePro}>
                  Unlock Pro timing
                </button>
              </>
            ) : (
              <>
                <Chk
                  id="adv-timing"
                  label="Enable timing tools"
                  checked={Boolean(opts.enableTimingTools)}
                  onChange={() =>
                    setOpts((o) => ({ ...o, enableTimingTools: !o.enableTimingTools }))
                  }
                />
                <label className="adv-label-group">
                  Frame rate
                  <select
                    className="adv-select"
                    value={opts.frameRate || "30"}
                    disabled={!opts.enableTimingTools}
                    onChange={(e) =>
                      setOpts((o) => ({ ...o, frameRate: e.target.value }))
                    }
                  >
                    {FRAME_RATES.map((fps) => (
                      <option key={fps} value={fps}>{fps} fps</option>
                    ))}
                  </select>
                </label>
                <Chk
                  id="adv-snap"
                  label="Snap timestamps to frames"
                  checked={Boolean(opts.snapToFrames)}
                  onChange={() =>
                    setOpts((o) => ({ ...o, snapToFrames: !o.snapToFrames }))
                  }
                />
                <label className="adv-label-group">
                  Offset (ms)
                  <input
                    type="number"
                    min="-600000"
                    max="600000"
                    step="10"
                    className="adv-number"
                    value={opts.timeOffsetMs ?? 0}
                    disabled={!opts.enableTimingTools}
                    onChange={(e) =>
                      setOpts((o) => ({ ...o, timeOffsetMs: Number(e.target.value) || 0 }))
                    }
                  />
                </label>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
