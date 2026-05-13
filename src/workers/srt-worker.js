import { applyRules, formatSRT, parseSRT } from "../lib/srt-engine";
import { sanitizeProcessingOptions } from "../lib/processing";

function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countPunctuation(text) {
  if (!text) return 0;
  return (text.match(/[.,!?]/g) || []).length;
}

self.onmessage = (event) => {
  const { requestId, text, opts, processingMode } = event.data || {};

  // Defense-in-depth: enforce clean-mode restrictions inside the worker
  // even if the component already applied them before sending.
  const safeOpts = sanitizeProcessingOptions(opts, processingMode);

  const parsed = parseSRT(text);
  if (parsed.error) {
    self.postMessage({ requestId, error: parsed.error });
    return;
  }

  const processed = applyRules(parsed.blocks, safeOpts);
  const output = formatSRT(processed);
  const origPrev = parsed.blocks
    .map((b, i) => `${i + 1}\n${b.timestamp}\n${b.text.join("\n")}`)
    .join("\n\n");
  const beforeText = parsed.blocks.map((b) => b.text.join(" ")).join(" ");
  const afterText = processed.map((b) => b.text.join(" ")).join(" ");
  const wordsBefore = countWords(beforeText);
  const wordsAfter = countWords(afterText);
  const lineCount = processed.reduce((sum, b) => sum + b.text.length, 0) || 1;
  const stats = {
    wordsBefore,
    wordsAfter,
    punctRemoved: Math.max(0, countPunctuation(beforeText) - countPunctuation(afterText)),
    avgWordsPerLine: Math.round((wordsAfter / lineCount) * 10) / 10,
  };

  self.postMessage({
    requestId,
    error: null,
    blocks: parsed.blocks,
    output,
    origPrev,
    stats,
  });
};
