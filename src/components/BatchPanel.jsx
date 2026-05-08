import React, { useState, useCallback, useRef } from "react";
import { parseSRT, applyRules, formatSRT } from "../lib/srt-engine";
import { deactivateLicense, clearLicense } from "../lib/license";

const MAX_FILES = 50;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function fmtSize(bytes) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const IDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IZip = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
  </svg>
);

export default function BatchPanel({ opts, license, onDeactivate }) {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList);
    setFiles((prev) => {
      const slots = MAX_FILES - prev.length;
      if (slots <= 0) return prev;
      const additions = incoming
        .filter((f) => f.name.toLowerCase().endsWith(".srt") && f.size <= MAX_FILE_SIZE)
        .slice(0, slots)
        .map((f) => ({ id: uid(), name: f.name, size: f.size, file: f, status: "pending", output: null, error: null }));
      return [...prev, ...additions];
    });
  }, []);

  const removeFile = useCallback((id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const processAll = useCallback(async () => {
    setIsProcessing(true);
    const toProcess = files.filter((f) => f.status === "pending" || f.status === "error");

    for (const bf of toProcess) {
      setFiles((prev) => prev.map((f) => f.id === bf.id ? { ...f, status: "processing", error: null } : f));
      try {
        const raw = await bf.file.text();
        const parsed = parseSRT(raw);
        if (parsed.error) throw new Error(parsed.error);
        const processed = applyRules(parsed.blocks, opts);
        const output = formatSRT(processed);
        setFiles((prev) => prev.map((f) => f.id === bf.id ? { ...f, status: "done", output } : f));
      } catch (err) {
        setFiles((prev) => prev.map((f) => f.id === bf.id ? { ...f, status: "error", error: err.message } : f));
      }
      await new Promise((r) => setTimeout(r, 0));
    }
    setIsProcessing(false);
  }, [files, opts]);

  const downloadOne = useCallback((bf) => {
    if (!bf.output) return;
    const blob = new Blob([bf.output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = bf.name.replace(/\.srt$/i, ".cleaned.srt");
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const downloadZip = useCallback(async () => {
    const done = files.filter((f) => f.status === "done");
    if (!done.length) return;
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    done.forEach((f) => zip.file(f.name.replace(/\.srt$/i, ".cleaned.srt"), f.output));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cleaned-subtitles.zip";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [files]);

  const handleDeactivate = useCallback(async () => {
    if (!window.confirm("Deactivate your Pro license on this device?")) return;
    try {
      await deactivateLicense(license.key, license.instanceId);
    } catch {
      clearLicense();
    }
    onDeactivate();
  }, [license, onDeactivate]);

  const doneCount = files.filter((f) => f.status === "done").length;
  const pendingCount = files.filter((f) => f.status === "pending" || f.status === "error").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className="batch-panel">

      {/* Header row */}
      <div className="batch-header">
        <div className="batch-header-left">
          <span className="batch-pro-badge">Pro</span>
          <span className="batch-title">Batch Processing</span>
          <span className="batch-subtitle">{files.length}/{MAX_FILES} files</span>
        </div>
        <div className="batch-header-right">
          {license?.customerEmail && (
            <span className="batch-license-email">{license.customerEmail}</span>
          )}
          <button className="batch-deactivate-btn" onClick={handleDeactivate}>
            Deactivate
          </button>
        </div>
      </div>

      {/* Drop zone */}
      {files.length < MAX_FILES && (
        <div
          className={`batch-dropzone ${dragOver ? "is-drag" : ""}`}
          role="button" tabIndex={0}
          aria-label="Drop multiple SRT files or click to browse"
          onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
        >
          <input ref={fileInputRef} type="file" accept=".srt" multiple className="hidden-file-input"
            onChange={(e) => addFiles(e.target.files)} />
          <span className="batch-dropzone-main">Drop multiple .srt files here or click to browse</span>
          <span className="batch-dropzone-sub">Max {MAX_FILES} files · 10 MB each · Processed in your browser</span>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="batch-file-list">
          {files.map((f) => (
            <div key={f.id} className={`batch-file-row is-${f.status}`}>
              <div className="batch-file-left">
                <span className={`batch-status-dot is-${f.status}`}>
                  {f.status === "done" && "✓"}
                  {f.status === "error" && "✗"}
                  {f.status === "processing" && "●"}
                  {f.status === "pending" && "–"}
                </span>
                <div className="batch-file-info">
                  <span className="batch-file-name">{f.name}</span>
                  {f.error && <span className="batch-file-error">{f.error}</span>}
                </div>
              </div>
              <div className="batch-file-right">
                <span className="batch-file-size">{fmtSize(f.size)}</span>
                {f.status === "done" && (
                  <button className="batch-icon-btn" onClick={() => downloadOne(f)} title="Download cleaned file">
                    <IDownload />
                  </button>
                )}
                {f.status !== "processing" && (
                  <button className="batch-icon-btn batch-remove" onClick={() => removeFile(f.id)} title="Remove" aria-label="Remove file">
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action bar */}
      {files.length > 0 && (
        <div className="batch-actions">
          <div className="batch-actions-left">
            <button className="btn-ghost" onClick={() => setFiles([])} disabled={isProcessing}>Clear all</button>
            {errorCount > 0 && (
              <span className="batch-error-badge">{errorCount} error{errorCount !== 1 ? "s" : ""}</span>
            )}
          </div>
          <div className="batch-actions-right">
            {doneCount > 0 && (
              <button className="btn-secondary" onClick={downloadZip}>
                <IZip /> Download ZIP ({doneCount})
              </button>
            )}
            <button
              className="btn-primary"
              onClick={processAll}
              disabled={isProcessing || pendingCount === 0}
            >
              {isProcessing
                ? `Processing…`
                : `Process ${pendingCount} file${pendingCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
