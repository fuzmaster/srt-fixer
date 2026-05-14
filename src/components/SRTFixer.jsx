import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Label from "./ui/Label";
import ProRow from "./ui/ProRow";
import Trust from "./ui/Trust";
import Card from "./ui/Card";
import FAQ from "./ui/FAQ";
import AdvancedPanel from "./ui/AdvancedPanel";
import LicenseGate from "./ui/LicenseGate";
import BatchPanel from "./BatchPanel";
import { activateStripeSession, getLicense, clearLicense, validateLicense } from "../lib/license";
import { sanitizeProcessingOptions } from "../lib/processing";

const SAMPLE_SRT = `1
00:00:00,000 --> 00:00:02,500
Hey, what's up? Welcome to another video.

2
00:00:02,500 --> 00:00:05,000
Today we're gonna talk about how to fix
messy subtitle files, super fast.

3
00:00:05,000 --> 00:00:07,500
It's easier than you think, honestly!!!

4
00:00:07,500 --> 00:00:10,000
So stick around for the full breakdown?`;

const SAMPLE_CLEANED_PREVIEW = `1
00:00:00,000 --> 00:00:02,500
Hey what's up Welcome to another video

2
00:00:02,500 --> 00:00:05,000
Today we're gonna talk about how to fix messy subtitle files super fast`;

const PRESETS = {
  shorts: { label: "YouTube Shorts", opts: { removePeriods: true, removeCommas: true, removeQuestions: false, removeExclamations: false, allCaps: false, singleLine: false, stripSpaces: true, limitWordsPerLine: false, smartRegroup: true, grammarSplit: true, wordsPerLineMin: 4, wordsPerLineMax: 7, maxCharsPerLine: 37, minCueSeconds: 0.8 } },
  tiktok:  { label: "TikTok",          opts: { removePeriods: true, removeCommas: true, removeQuestions: true,  removeExclamations: true,  allCaps: true,  singleLine: false, stripSpaces: true, limitWordsPerLine: false, smartRegroup: true, grammarSplit: true, wordsPerLineMin: 3, wordsPerLineMax: 6, maxCharsPerLine: 32, minCueSeconds: 0.7 } },
  podcast: { label: "Podcast Clips",   opts: { removePeriods: false, removeCommas: false, removeQuestions: false, removeExclamations: false, allCaps: false, singleLine: false, stripSpaces: true, limitWordsPerLine: false, smartRegroup: true, grammarSplit: true, wordsPerLineMin: 5, wordsPerLineMax: 10, maxCharsPerLine: 50, minCueSeconds: 1.0 } },
  clean:   { label: "Clean",           opts: { removePeriods: true, removeCommas: true, removeQuestions: false, removeExclamations: false, allCaps: false, singleLine: true,  stripSpaces: true, limitWordsPerLine: false, smartRegroup: false, grammarSplit: false, wordsPerLineMin: 4, wordsPerLineMax: 8, maxCharsPerLine: 42, minCueSeconds: 0.8 } },
};

const MAX_TEXT_CHARS = 10 * 1024 * 1024;

// Parsing and transformation run in src/workers/srt-worker.js via src/lib/srt-engine.js

// ═══════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════

const I = {
  lock: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="8" height="6.5" rx="1"/><path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6"/></svg>,
  check: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2.5 6.5 5 9 9.5 3"/></svg>,
  upload: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  file: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  copy: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  zap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  terminal: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  monitor: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
};

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

export default function SRTFixer() {
  const [mode, setMode] = useState("upload");
  const [raw, setRaw] = useState("");
  const [fname, setFname] = useState("");
  const [fsize, setFsize] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [drag, setDrag] = useState(false);
  const [copied, setCopied] = useState(false);
  const fRef = useRef(null);
  const toolRef = useRef(null);
  const workerRef = useRef(null);
  const latestReqRef = useRef(0);

  const [opts, setOpts] = useState({
    // Cleanup
    removePeriods: true, removeCommas: true, removeQuestions: false, removeExclamations: false,
    allCaps: false, stripSpaces: true,
    // Grouping (smartRegroup intentionally false — preserved by processingMode gate)
    singleLine: false, limitWordsPerLine: false,
    smartRegroup: false, grammarSplit: true,
    wordsPerLineMin: 4, wordsPerLineMax: 7,
    maxCharsPerLine: 37, minCueSeconds: 0.8,
    // Pro timing tools
    enableTimingTools: false, frameRate: "30", snapToFrames: false, timeOffsetMs: 0,
    // Active platform
    platform: "",
  });
  // "clean" = preserve every timestamp exactly; "regroup" = may change cue timing
  const [processingMode, setProcessingMode] = useState("clean");
  const [sessionStats, setSessionStats] = useState({ filesProcessed: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [license, setLicense] = useState(() => getLicense());
  const isPro = license !== null;

  const [parsed, setParsed] = useState(null);
  const [output, setOutput] = useState("");
  const [origPrev, setOrigPrev] = useState("");
  const [stats, setStats] = useState({ wordsBefore: 0, wordsAfter: 0, punctRemoved: 0, avgWordsPerLine: 0 });
  const [debouncedRaw, setDebouncedRaw] = useState("");
  const [wordsMinInput, setWordsMinInput] = useState("4");
  const [wordsMaxInput, setWordsMaxInput] = useState("7");
  const tog = (k) => setOpts((o) => ({ ...o, [k]: !o[k], platform: "" }));

  useEffect(() => {
    const worker = new Worker(new URL("../workers/srt-worker.js", import.meta.url), { type: "module" });
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const { requestId, error: workerError, blocks, output: nextOutput, origPrev: nextOrigPrev, stats: nextStats } = event.data || {};
      if (requestId !== latestReqRef.current) return;
      setIsProcessing(false);
      if (workerError) {
        setError(workerError);
        setParsed(null);
        setOutput("");
        setOrigPrev("");
        setStats({ wordsBefore: 0, wordsAfter: 0, punctRemoved: 0, avgWordsPerLine: 0 });
        return;
      }

      setError("");
      setParsed(blocks);
      setOutput(nextOutput || "");
      setOrigPrev(nextOrigPrev || "");
      setStats(nextStats || { wordsBefore: 0, wordsAfter: 0, punctRemoved: 0, avgWordsPerLine: 0 });
    };

    worker.onerror = () => {
      setIsProcessing(false);
      setError("Processing failed. Please try again.");
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!license) return;
    validateLicense(license.key, license.instanceId)
      .then((valid) => {
        if (!valid) { clearLicense(); setLicense(null); }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("stripe_session_id") || params.get("session_id");
    if (!sessionId) return;

    setIsProcessing(true);
    activateStripeSession(sessionId)
      .then((lic) => {
        setLicense(lic);
        setError("");
        if (lic.licenseKey) {
          setNotice(`Pro activated. Save this license key: ${lic.licenseKey}`);
        }
      })
      .catch((err) => {
        setError(err.message || "Stripe payment could not be verified.");
      })
      .finally(() => {
        setIsProcessing(false);
        params.delete("stripe_session_id");
        params.delete("session_id");
        const nextSearch = params.toString();
        const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
        window.history.replaceState({}, "", nextUrl);
      });
  }, []);

  const processWithWorker = useCallback((text, options, pMode) => {
    if (!workerRef.current) {
      setError("Processing engine is unavailable.");
      return;
    }
    setIsProcessing(true);
    const requestId = latestReqRef.current + 1;
    latestReqRef.current = requestId;
    workerRef.current.postMessage({ requestId, text, opts: options, processingMode: pMode ?? "clean" });
  }, []);

  const process = useCallback((text, name, size) => {
    setRaw(text);
    if (name) setFname(name);
    if (size) setFsize(size);
  }, []);

  const openBatchPro = useCallback(() => {
    setMode("batch");
    window.setTimeout(() => {
      toolRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  useEffect(() => {
    if (mode !== "paste") {
      setDebouncedRaw(raw);
      return;
    }

    const t = setTimeout(() => {
      setDebouncedRaw(raw);
    }, 300);
    return () => clearTimeout(t);
  }, [raw, mode]);

  useEffect(() => {
    const source = mode === "paste" ? debouncedRaw : raw;
    if (!source || !source.trim()) return;
    const proSafeOpts = isPro ? opts : { ...opts, enableTimingTools: false };
    const effectiveOpts = sanitizeProcessingOptions(proSafeOpts, processingMode);
    processWithWorker(source, effectiveOpts, processingMode);
  }, [opts, raw, debouncedRaw, mode, processingMode, processWithWorker, isPro]);

  useEffect(() => {
    setWordsMinInput(String(opts.wordsPerLineMin));
    setWordsMaxInput(String(opts.wordsPerLineMax));
  }, [opts.wordsPerLineMin, opts.wordsPerLineMax]);

  const has = parsed && output;
  const count = parsed?.length || 0;

  const PREVIEW_MAX_BLOCKS = 50;
  const truncatedOutput = useMemo(() => {
    if (!output) return "";
    const blocks = output.split(/\n\n+/);
    if (blocks.length <= PREVIEW_MAX_BLOCKS) return output;
    return blocks.slice(0, PREVIEW_MAX_BLOCKS).join("\n\n") + `\n\n[…${blocks.length - PREVIEW_MAX_BLOCKS} more — download to see all]`;
  }, [output]);
  const truncatedOrig = useMemo(() => {
    if (!origPrev) return "";
    const blocks = origPrev.split(/\n\n+/);
    if (blocks.length <= PREVIEW_MAX_BLOCKS) return origPrev;
    return blocks.slice(0, PREVIEW_MAX_BLOCKS).join("\n\n") + `\n\n[…${blocks.length - PREVIEW_MAX_BLOCKS} more]`;
  }, [origPrev]);

  const loadSample = () => {
    setMode("upload");
    process(SAMPLE_SRT, "sample.srt", SAMPLE_SRT.length);
    setProcessingMode("clean");
    setOpts((o) => ({
      ...o,
      removePeriods: true,
      removeCommas: true,
      removeQuestions: true,
      removeExclamations: true,
      allCaps: false,
      singleLine: true,
      smartRegroup: false,
      platform: "",
    }));
    setSessionStats((s) => ({ ...s, filesProcessed: s.filesProcessed + 1 }));
    window.setTimeout(() => {
      toolRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const applyPreset = (presetKey) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    setOpts(preset.opts);
    setProcessingMode(preset.opts.smartRegroup ? "regroup" : "clean");
  };

  useEffect(() => {
    const saved = localStorage.getItem("srt-fixer-opts");
    if (saved) try { setOpts(JSON.parse(saved)); } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem("srt-fixer-opts", JSON.stringify(opts));
    }, 250);
    return () => clearTimeout(t);
  }, [opts]);


  const loadFile = (f) => {
    if (!f) return;
    setError("");
    if (!f.name.toLowerCase().endsWith(".srt")) { setError("Only .srt files are supported."); return; }
    if (f.size > 10 * 1024 * 1024) { setError("File too large. Max 10 MB."); return; }
    const r = new FileReader();
    r.onload = (e) => {
      process(e.target.result, f.name, f.size);
      setSessionStats((s) => ({ ...s, filesProcessed: s.filesProcessed + 1 }));
    };
    r.onerror = () => setError("Failed to read file.");
    r.readAsText(f);
  };

  const onDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDrag(false); loadFile(e.dataTransfer?.files?.[0]); };
  const onDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setDrag(true); if (error) setError(""); };
  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDrag(true); };
  const onDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDrag(false); };

  const download = () => {
    if (!output) return;
    const base = fname ? fname.replace(/\.srt$/i, "") : "cleaned-subtitles";
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${base}.cleaned.srt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const copy = async () => {
    if (!output) return;
    if (!navigator.clipboard?.writeText) {
      setError("Clipboard copy is unavailable in this browser. Use Download instead.");
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      setError("Clipboard copy failed. Use Download instead.");
      return;
    }
    setCopied(true); setTimeout(() => setCopied(false), 2200);
  };

  const reset = () => {
    setRaw("");
    setFname("");
    setFsize(0);
    setError("");
    setParsed(null);
    setOutput("");
    setOrigPrev("");
    setStats({ wordsBefore: 0, wordsAfter: 0, punctRemoved: 0, avgWordsPerLine: 0 });
    setCopied(false);
    if (fRef.current) fRef.current.value = "";
  };

  const outName = fname ? fname.replace(/\.srt$/i, ".cleaned.srt") : "cleaned-subtitles.srt";

  return (
    <div className="app-root">
      {/* ═══════ HERO ═══════ */}
      <header className="grain gbg app-hero">
        <div className="app-container hero-inner">

          <div className="fu d1 hero-brand-row">
            <span className="hero-srt-tag">.srt</span>
            <span className="hero-brand">SRT Fixer</span>
          </div>

          <h1 className="fu d2 hero-title">
            Clean and fix .SRT subtitle files<br /><span className="hero-title-accent">before you burn them into reels</span>
          </h1>

          <p className="fu d3 hero-copy">
            Remove punctuation, fix casing, clean line breaks, and download a polished .srt file. This formats existing subtitles, it does not transcribe audio or video.
          </p>

          <button className="fu d4 btn-primary" onClick={() => toolRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            Drop your .srt or paste captions {I.arrow}
          </button>

          <div className="fu d5 hero-trust-row">
            <Trust icon={I.terminal} text="No AI rewriting" />
            <Trust icon={I.shield} text="Files stay in your browser" />
            <Trust icon={I.zap} text="No account needed" />
          </div>

          <div className="fu d6 hero-demo-card" aria-label="Before and after subtitle cleanup example">
            <div className="hero-demo-copy">
              <Label>Instant Proof</Label>
              <h2 className="hero-demo-title">Messy captions in. Burn-in ready SRT out.</h2>
              <p className="hero-demo-text">
                See punctuation removed, line breaks cleaned, and original timestamps preserved before you upload your own file.
              </p>
              <button className="hero-demo-btn" onClick={loadSample}>
                {I.zap} Load demo
              </button>
            </div>
            <div className="hero-demo-preview-grid">
              <div className="hero-demo-preview is-before">
                <div className="hero-demo-preview-head">Before</div>
                <pre>{SAMPLE_SRT.split("\n\n").slice(0, 2).join("\n\n")}</pre>
              </div>
              <div className="hero-demo-preview is-after">
                <div className="hero-demo-preview-head">After</div>
                <pre>{SAMPLE_CLEANED_PREVIEW}</pre>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="page-nav app-container" aria-label="Page sections">
        <a href="#tool">Tool</a>
        <a href="#workflows">Workflows</a>
        <a href="#export-guides">Export Guides</a>
        <a href="#free-vs-pro">Free vs Pro</a>
        <a href="#faq">FAQ</a>
      </nav>

      {/* ═══════ TOOL ═══════ */}
      <main ref={toolRef} id="tool" className="app-container tool-main">
        <div className="fu d3">
          <Label>Tool</Label>
          <div className="tool-label-gap" />

          {/* Tabs */}
          <div className="tool-tabs">
            {[
              { id: "upload", label: "Upload .srt" },
              { id: "paste",  label: "Paste text" },
              { id: "batch",  label: "Batch", pro: true },
            ].map(({ id, label, pro }) => (
              <button key={id} onClick={() => { setMode(id); if (id !== "batch") reset(); }} aria-pressed={mode === id}
                className={`tool-tab-btn ${mode === id ? "is-active" : ""} ${id === "upload" || id === "paste" ? "has-divider" : ""}`}>
                {label}{pro && <span className="tab-pro-chip">{isPro ? "Pro" : "Pro"}</span>}
              </button>
            ))}
          </div>

          {/* Input */}
          {mode === "batch" ? (
            isPro
              ? <BatchPanel opts={opts} processingMode={processingMode} license={license} onDeactivate={() => setLicense(null)} />
              : <LicenseGate onActivated={(lic) => { setLicense(lic); setNotice(""); }} />
          ) : mode === "upload" ? (
            <div role="button" tabIndex={0} aria-label="Upload SRT file — drag and drop or click to browse"
              onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              onClick={() => { if (error) setError(""); fRef.current?.click(); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fRef.current?.click(); } }}
              className={`dropzone ${drag ? "is-drag" : ""} ${fname ? "has-file" : ""}`}>
              <input ref={fRef} type="file" accept=".srt" aria-hidden="true" tabIndex={-1} className="hidden-file-input" onChange={(e) => { if (error) setError(""); loadFile(e.target.files?.[0]); }} />

              {fname ? (
                <div className="upload-file-row">
                  <span className="upload-file-icon">{I.file}</span>
                  <div className="upload-file-meta">
                    <div className="upload-file-name">{fname}</div>
                    <div className="upload-file-subtext">
                      {count} subtitle{count !== 1 ? "s" : ""} found{fsize > 0 && ` · ${(fsize / 1024).toFixed(1)} KB`}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); reset(); }} aria-label="Remove file"
                    className="upload-remove-btn">{I.x}</button>
                </div>
              ) : (
                <>
                  <div className="dropzone-empty-icon">{I.upload}</div>
                  <p className="dropzone-empty-copy">Drop your <strong className="dropzone-empty-strong">.srt</strong> file here or click to browse</p>
                  <p className="dropzone-empty-subcopy">Accepts .srt only · Formats existing subtitles · No audio/video transcription</p>
                  <div className="dropzone-trust-badge">
                    {I.shield} 100% private: files process locally in your browser
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="srt-paste" className="visually-hidden">Paste SRT content</label>
              <textarea id="srt-paste" value={raw} onChange={(e) => { if (error) setError(""); process(e.target.value, "", 0); }} spellCheck={false}
                maxLength={MAX_TEXT_CHARS}
                onPaste={(e) => {
                  const pasted = e.clipboardData?.getData("text") || "";
                  const nextLen = raw.length + pasted.length;
                  if (nextLen > MAX_TEXT_CHARS) {
                    e.preventDefault();
                    const room = Math.max(0, MAX_TEXT_CHARS - raw.length);
                    if (room > 0) {
                      const clipped = pasted.slice(0, room);
                      if (error) setError("");
                      process(raw + clipped, "", 0);
                    }
                    setError("Paste limit reached (max 10 MB text).");
                  }
                }}
                placeholder={"1\n00:00:00,000 --> 00:00:01,500\nHello, world.\n\n2\n00:00:01,500 --> 00:00:03,000\nThis is a test."}
                className="paste-textarea" />
              {parsed && <div className="paste-detected-count">{count} subtitle{count !== 1 ? "s" : ""} detected</div>}
            </div>
          )}

          {/* Error */}
          {error && (
            <div role="alert" className="error-alert">
              <span className="error-alert-icon">{I.x}</span>{error}
            </div>
          )}
          {notice && (
            <div role="status" className="success-alert">
              {notice}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="fu d4 options-panel">

          {/* Mode selector */}
          <div className="mode-selector" role="group" aria-label="Processing mode">
            <button
              className={`mode-btn ${processingMode === "clean" ? "is-active" : ""}`}
              onClick={() => setProcessingMode("clean")}
              aria-pressed={processingMode === "clean"}
            >
              <span className="mode-btn-title">Clean Text Only</span>
              <span className="mode-btn-desc">Keeps original timestamps and cue breaks</span>
            </button>
            <button
              className={`mode-btn ${processingMode === "regroup" ? "is-active" : ""}`}
              onClick={() => setProcessingMode("regroup")}
              aria-pressed={processingMode === "regroup"}
            >
              <span className="mode-btn-title">Regroup Captions</span>
              <span className="mode-btn-desc">May change cue timing — advanced</span>
            </button>
          </div>

          {processingMode === "regroup" && (
            <div className="mode-warning" role="note">
              <strong>Timing may change.</strong> Regroup rebuilds caption structure. Use only when you want the app to redistribute words across cues. For exact timestamp preservation, use Clean Text Only.
            </div>
          )}

          {/* Platform presets — regroup mode only */}
          {processingMode === "regroup" && (
            <div className="options-platform-row">
              <div className="preset-row">
                {Object.entries(PRESETS).map(([key, preset]) => {
                  const active = opts.platform === key;
                  return (
                    <button key={key} onClick={() => { applyPreset(key); setOpts(o => ({ ...o, platform: key })); }}
                      className={`preset-chip ${active ? "is-active" : ""}`}>
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Text transform toggles (both modes) */}
          <div className="options-toggle-header">
            <div className="toggle-chip-row">
              {[
                { key: "removePeriods", label: "Strip Punctuation",
                  active: opts.removePeriods || opts.removeCommas,
                  onToggle: () => { const on = !(opts.removePeriods || opts.removeCommas); setOpts(o => ({ ...o, removePeriods: on, removeCommas: on, removeQuestions: on, removeExclamations: on, platform: "" })); } },
                { key: "allCaps", label: "ALL CAPS", active: opts.allCaps, onToggle: () => tog("allCaps") },
              ].map(({ key, label, active, onToggle }) => (
                <button key={key} onClick={onToggle} aria-pressed={active}
                  className={`toggle-chip ${active ? "is-active" : ""}`}>
                  <span className={`toggle-chip-dot ${active ? "is-active" : ""}`} />
                  {label}
                </button>
              ))}

              {/* Regroup-only toggles */}
              {processingMode === "regroup" && (
                <>
                  <button onClick={() => tog("smartRegroup")} aria-pressed={opts.smartRegroup}
                    className={`toggle-chip ${opts.smartRegroup ? "is-active" : ""}`}>
                    <span className={`toggle-chip-dot ${opts.smartRegroup ? "is-active" : ""}`} />
                    Smart Regroup
                  </button>
                  <button onClick={() => tog("grammarSplit")} aria-pressed={opts.grammarSplit}
                    className={`toggle-chip ${opts.grammarSplit ? "is-active" : ""}`}>
                    <span className={`toggle-chip-dot ${opts.grammarSplit ? "is-active" : ""}`} />
                    Grammar-Aware (EN)
                  </button>
                </>
              )}
            </div>

            <button onClick={loadSample} className="sample-btn">
              {I.zap} Try sample
            </button>
          </div>

          {/* Words per caption — regroup mode only */}
          {processingMode === "regroup" && (
            <div className="words-panel">
              <div className="words-header">
                <span className="words-title">Words per caption</span>
                <span className="words-value">{opts.wordsPerLineMin}–{opts.wordsPerLineMax}</span>
              </div>
              <div className="words-grid">
                <label className="words-col-label">
                  <span className="words-input-row">
                    <span>Min ({opts.wordsPerLineMin})</span>
                    <input
                      type="number" min="1" max={opts.wordsPerLineMax} value={wordsMinInput}
                      onChange={(e) => setWordsMinInput(e.target.value)}
                      onBlur={() => {
                        const parsedMin = Number.parseInt(wordsMinInput, 10);
                        const next = Number.isFinite(parsedMin) ? parsedMin : opts.wordsPerLineMin;
                        setOpts((o) => ({ ...o, wordsPerLineMin: Math.max(1, Math.min(next, o.wordsPerLineMax)), platform: "" }));
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                      className="words-number"
                    />
                  </span>
                  <input type="range" min="1" max="10" value={opts.wordsPerLineMin}
                    onChange={(e) => setOpts((o) => ({ ...o, wordsPerLineMin: Math.min(Number(e.target.value), o.wordsPerLineMax), platform: "" }))}
                    className="words-range" />
                </label>
                <label className="words-col-label">
                  <span className="words-input-row">
                    <span>Max ({opts.wordsPerLineMax})</span>
                    <input
                      type="number" min={opts.wordsPerLineMin} max="15" value={wordsMaxInput}
                      onChange={(e) => setWordsMaxInput(e.target.value)}
                      onBlur={() => {
                        const parsedMax = Number.parseInt(wordsMaxInput, 10);
                        const next = Number.isFinite(parsedMax) ? parsedMax : opts.wordsPerLineMax;
                        setOpts((o) => ({ ...o, wordsPerLineMax: Math.min(15, Math.max(next, o.wordsPerLineMin)), platform: "" }));
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                      className="words-number"
                    />
                  </span>
                  <input type="range" min="2" max="15" value={opts.wordsPerLineMax}
                    onChange={(e) => setOpts((o) => ({ ...o, wordsPerLineMax: Math.max(Number(e.target.value), o.wordsPerLineMin), platform: "" }))}
                    className="words-range" />
                </label>
              </div>
            </div>
          )}

          {/* Advanced disclosure */}
          <AdvancedPanel opts={opts} setOpts={setOpts} processingMode={processingMode} isPro={isPro} onRequirePro={openBatchPro} />

          {/* Pro upsell */}
          {!isPro && (
            <div className="pro-tease-inline">
              <Label><span className="pro-tease-inline-label">{I.lock} SRT Fixer Pro</span></Label>
              <div className="pro-tease-gap" />
              <div onClick={openBatchPro} role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openBatchPro(); } }}
                className="pro-tease-inline-grid">
                <ProRow label="Batch process up to 50 .srt files at once" lockIcon={I.lock} />
                <ProRow label="Download all cleaned files as a ZIP" lockIcon={I.lock} />
                <ProRow label="Snap subtitle timing to project framerate" lockIcon={I.lock} />
                <ProRow label="Consistent settings across every file" lockIcon={I.lock} />
              </div>
            </div>
          )}
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="processing-bar" aria-live="polite" aria-label="Processing">
            <span className="processing-dot" />Processing…
          </div>
        )}

        {/* Preview */}
        {has && (
          <div className="preview-section">
            <div className="preview-header">
              <Label>Preview — {count} subtitle{count !== 1 ? "s" : ""}</Label>
              <div className="preview-stats-row">
                <span>{stats.wordsBefore} → <span className="accent-text">{stats.wordsAfter}</span> words</span>
                {stats.punctRemoved > 0 && <span className="accent-text">-{stats.punctRemoved} punctuation</span>}
                <span>{stats.avgWordsPerLine} avg/line</span>
                {sessionStats.filesProcessed > 1 && <span className="accent-text">Session: {sessionStats.filesProcessed} files</span>}
              </div>
            </div>
            <div className="preview-grid">
              {[
                { l: "Original", c: truncatedOrig, on: false },
                { l: "Cleaned", c: truncatedOutput, on: true },
              ].map((p) => (
                <div key={p.l} className={`preview-card ${p.on ? "is-cleaned" : "is-original"}`}>
                  <div className={`preview-card-head ${p.on ? "is-cleaned" : "is-original"}`}>{p.l}</div>
                  <pre className={`preview-card-body ${p.on ? "is-cleaned" : "is-original"}`}>{p.c}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {has && (
          <div className="action-bar">
            <button className="btn-primary" onClick={download}>{I.download} Download {outName}</button>
            <button className={`btn-secondary ${copied ? "is-copied" : ""}`} onClick={copy} aria-label={copied ? "Copied" : "Copy output"}>
              {copied ? I.check : I.copy}{copied ? "Copied" : "Copy"}
            </button>
            <button className="btn-ghost" onClick={reset}>Reset</button>
          </div>
        )}
      </main>

      {/* ═══════ WHY EDITORS USE IT ═══════ */}
      <section className="app-container section-stack" id="workflows">
        <div className="fu d5">
          <Label>Why editors use it</Label>
          <div className="spacer-20" />
          <div className="workflow-strip" aria-label="Supported editing workflows">
            {["CapCut", "Premiere Pro", "DaVinci Resolve", "Final Cut Pro", "YouTube Shorts", "TikTok"].map((tool) => (
              <span key={tool} className="workflow-chip">{tool}</span>
            ))}
          </div>
          <div className="spacer-20" />
          <div className="features-grid">
            <Card icon={I.zap} title="Strips punctuation fast" desc="Periods, commas, question marks gone in one click. No find-and-replace chains." />
            <Card icon={I.file} title="Forces single-line captions" desc="Multi-line auto-captions collapsed to one line per cue. Clean for burn-in." />
            <Card icon={I.clock} title="Keeps timestamps intact" desc="In Clean Text Only mode, every original timestamp is preserved exactly. Regroup mode may rebuild timing." />
            <Card icon={I.monitor} title="Runs locally" desc="Everything processes in your browser. No uploads, no servers, no waiting." />
            <Card icon={I.shield} title="Deterministic output" desc="Same input, same output, every time. No AI rewriting, no surprises." />
          </div>
        </div>
      </section>

      {/* ═══════ WORKFLOW SEO ═══════ */}
      <section className="app-container section-stack">
        <div className="fu d5 workflow-section">
          <Label>Caption Cleanup Workflows</Label>
          <div className="workflow-head-row">
            <h2 className="workflow-title">Built for the exact SRT mess editors search for</h2>
            <p className="workflow-copy">
              Start with an exported subtitle file, clean the text locally, then import the polished .srt back into your editing workflow.
            </p>
          </div>
          <div className="workflow-grid">
            <div className="workflow-card">
              <span className="workflow-kicker">CapCut</span>
              <h3>Clean SRT files for CapCut edits</h3>
              <p>Remove noisy punctuation and force cleaner one-line captions before burning subtitles into TikTok, Reels, or Shorts exports.</p>
              <button onClick={loadSample} className="workflow-link-btn">Try CapCut-style cleanup {I.arrow}</button>
            </div>
            <div className="workflow-card">
              <span className="workflow-kicker">Premiere Pro</span>
              <h3>Fix subtitle line breaks before import</h3>
              <p>Keep cue timing intact while cleaning awkward auto-caption wrapping, spacing, casing, and punctuation from exported .srt files.</p>
              <button onClick={loadSample} className="workflow-link-btn">Preview timestamp-safe cleanup {I.arrow}</button>
            </div>
            <div className="workflow-card">
              <span className="workflow-kicker">YouTube Captions</span>
              <h3>Remove punctuation from auto captions</h3>
              <p>Turn rough YouTube-style captions into cleaner burn-in subtitles without sending your file to a server or rewriting the words.</p>
              <button onClick={loadSample} className="workflow-link-btn">Load the before/after demo {I.arrow}</button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ EXPORT GUIDES ═══════ */}
      <section className="app-container section-stack" id="export-guides">
        <div className="fu d6 guide-layout">
          <aside className="guide-nav" aria-label="Export guide navigation">
            <Label>Export SRTs From</Label>
            <nav className="guide-nav-links">
              <a href="#export-capcut">CapCut</a>
              <a href="#export-premiere">Premiere Pro</a>
              <a href="#export-resolve">DaVinci Resolve</a>
              <a href="#export-final-cut">Final Cut Pro</a>
              <a href="#export-youtube">YouTube Studio</a>
            </nav>
          </aside>

          <div className="guide-content">
            <div className="guide-intro">
              <Label>SRT Export Guide</Label>
              <h2>Get the caption file first, then clean it here</h2>
              <p>
                SRT Fixer does not make captions from audio. Export an existing subtitle file from your editor or platform, clean it here, then bring the polished .srt back into your video workflow.
              </p>
            </div>

            <div className="guide-card" id="export-capcut">
              <h3>Export SRT from CapCut</h3>
              <ol>
                <li>Open your project and generate or import captions.</li>
                <li>Open the captions/subtitles panel.</li>
                <li>Choose the export captions option and select <strong>SRT</strong> when available.</li>
                <li>Drop the exported .srt into SRT Fixer, clean it, then re-import the cleaned file.</li>
              </ol>
            </div>

            <div className="guide-card" id="export-premiere">
              <h3>Export SRT from Premiere Pro</h3>
              <ol>
                <li>Open the Text panel and review your caption track.</li>
                <li>Select the caption track in the timeline.</li>
                <li>Use the captions export option and choose <strong>SubRip Subtitle Format (.srt)</strong>.</li>
                <li>Clean the exported file in SRT Fixer before importing or burning it into the final edit.</li>
              </ol>
            </div>

            <div className="guide-card" id="export-resolve">
              <h3>Export SRT from DaVinci Resolve</h3>
              <ol>
                <li>Create or import subtitles on a subtitle track.</li>
                <li>Open the subtitle track options or deliver/export settings.</li>
                <li>Export captions as a separate <strong>.srt</strong> subtitle file.</li>
                <li>Run the file through SRT Fixer to clean punctuation, casing, and line breaks.</li>
              </ol>
            </div>

            <div className="guide-card" id="export-final-cut">
              <h3>Export SRT from Final Cut Pro</h3>
              <ol>
                <li>Add captions to your timeline or import an existing caption file.</li>
                <li>Use the caption export/share options for the project.</li>
                <li>Choose an SRT-compatible caption export when available.</li>
                <li>Clean the .srt here before sending it to a burn-in tool or another editor.</li>
              </ol>
            </div>

            <div className="guide-card" id="export-youtube">
              <h3>Export SRT from YouTube Studio</h3>
              <ol>
                <li>Open YouTube Studio and choose your video.</li>
                <li>Go to Subtitles and open the caption language you want to use.</li>
                <li>Download the captions as an <strong>.srt</strong> file.</li>
                <li>Clean the file in SRT Fixer before using it in Shorts, clips, or another edit.</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ PRO TEASE ═══════ */}
      <section className="app-container section-stack">
        <div className="fu d6 pro-marketing-card" id="free-vs-pro">
          <div className="pro-marketing-topline" />
          <div className="pro-marketing-head-row">
            <Label>Free vs Pro</Label>
            <span className="pro-marketing-pill">Available Now</span>
          </div>
          <h2 className="pro-marketing-title">Free is for one-off cleanup. Pro is for getting the edit done faster.</h2>
          <p className="pro-marketing-copy">
            Gen Z and Alpha creators do not want another production chore. They want the Reel finished, posted, and out of their head. Pro turns repetitive caption cleanup into one batch action so editors can stay in the creative flow.
          </p>
          <div className="plan-grid">
            <div className="plan-card">
              <h3>Free</h3>
              <p>Best for cleaning one caption file before a post.</p>
              <ul>
                <li>Upload or paste one .srt file</li>
                <li>Remove punctuation and clean spacing</li>
                <li>Keep original timestamps intact</li>
                <li>Download one cleaned file</li>
              </ul>
            </div>
            <div className="plan-card is-pro">
              <h3>Pro</h3>
              <p>Best for creators and editors handling a full content batch.</p>
              <ul>
                <li>Process up to 50 files in one pass</li>
                <li>Apply the same cleanup settings across every file</li>
                <li>Snap captions to project framerates</li>
                <li>Download all cleaned files as a ZIP</li>
              </ul>
              <button onClick={openBatchPro} className="plan-upgrade-btn">Unlock batch cleanup {I.arrow}</button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="app-container section-stack" id="faq">
        <div className="fu d7">
          <Label>Frequently Asked</Label>
          <div className="spacer-12" />
          <div className="faq-wrap">
            <FAQ q="What does SRT Fixer do?" a="It cleans auto-generated subtitle files by removing punctuation, forcing single-line captions, converting to ALL CAPS, and stripping extra whitespace. All processing happens instantly in your browser." />
            <FAQ q="Does it modify my timestamps?" a="In Clean Text Only mode (the default), every timestamp is preserved exactly — cue count, cue order, and timing are untouched. Only subtitle text is modified. Regroup Captions mode and Pro timing tools are advanced options that can intentionally adjust cue timing." />
            <FAQ q="Does this use AI?" a="No. SRT Fixer applies deterministic formatting rules. Your captions are never rewritten, paraphrased, or sent to any server." />
            <FAQ q="Which NLEs does this work with?" a="Any editor that imports .srt files — Premiere Pro, After Effects, DaVinci Resolve, Final Cut Pro, CapCut, and more." />
            <FAQ q="Is my file uploaded anywhere?" a="No. Everything runs client-side in your browser. Your files never leave your machine." />
            <FAQ q="Can I use this for long-form content?" a="Yes. The parser handles large files well. There's a 10 MB size limit which covers most use cases." />
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="app-container app-footer">
        <div className="app-footer-inner">
          <div className="app-footer-brand-row">
            <span className="app-footer-tag">.srt</span>
            <span className="app-footer-brand">SRT Fixer</span>
          </div>
          <div className="app-footer-copy">
            Built by Jacob Britten · All processing runs in your browser
          </div>
        </div>
      </footer>
    </div>
  );
}
