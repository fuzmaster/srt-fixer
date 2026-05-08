export function parseSRT(raw) {
  if (!raw || !raw.trim()) return { blocks: [], error: "No input provided." };
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const chunks = normalized.split(/\n\n+/).filter((c) => c.trim());
  const blocks = [];
  const tsRe =
    /^\s*\d{2}:\d{2}:\d{2}(?:[,.]\d{1,3})?\s*-->\s*\d{2}:\d{2}:\d{2}(?:[,.]\d{1,3})?\s*$/;

  for (const chunk of chunks) {
    const lines = chunk.split("\n").filter((l) => l.trim());
    if (lines.length < 2) continue;
    let idx = 0;
    if (/^\d+$/.test(lines[0].trim())) idx = 1;
    if (!lines[idx] || !tsRe.test(lines[idx].trim())) continue;
    const timestamp = lines[idx].trim();
    const [startRaw, endRaw] = timestamp.split(/\s*-->\s*/);
    const start = toSeconds(startRaw);
    const end = toSeconds(endRaw);
    const textLines = lines
      .slice(idx + 1)
      .map((l) => l.trim())
      .filter(Boolean);
    if (textLines.length === 0) continue;
    blocks.push({ timestamp, start, end, text: textLines });
  }

  if (blocks.length === 0) {
    return {
      blocks: [],
      error: "No valid SRT blocks found. Check your input format.",
    };
  }
  return { blocks, error: null };
}

function toSeconds(ts) {
  if (!ts) return Number.NaN;
  const clean = ts.trim().replace(",", ".");
  const m = clean.match(/^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!m) return Number.NaN;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  const s = Number(m[3]);
  const msRaw = m[4] ?? "0";
  const ms = Number(msRaw.padEnd(3, "0").slice(0, 3));
  return h * 3600 + mm * 60 + s + ms / 1000;
}

function toTimestamp(sec) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const totalMs = Math.round(sec * 1000);
  const h = Math.floor(totalMs / 3600000);
  const m = Math.floor((totalMs % 3600000) / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
    s
  ).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

const CLAUSE_STARTERS = new Set([
  "and",
  "but",
  "or",
  "so",
  "because",
  "when",
  "that",
  "which",
  "who",
  "if",
  "as",
  "while",
  "although",
  "though",
  "since",
  "until",
  "unless",
  "however",
  "therefore",
  "then",
]);
const ARTICLES = new Set([
  "a",
  "an",
  "the",
  "my",
  "your",
  "his",
  "her",
  "its",
  "our",
  "their",
  "this",
  "these",
  "those",
]);
const PREPS = new Set([
  "to",
  "of",
  "in",
  "on",
  "at",
  "for",
  "with",
  "by",
  "from",
  "about",
  "into",
  "over",
  "after",
  "before",
  "between",
]);

function scoreBreakPoint(words, i) {
  const curr = words[i];
  const next = words[i + 1] || "";
  const nextLow = next.replace(/[^a-z]/gi, "").toLowerCase();
  let score = 0;
  if (/[.!?]$/.test(curr)) score += 6;
  if (/[,;:]$/.test(curr)) score += 3;
  if (CLAUSE_STARTERS.has(nextLow)) score += 3;
  if (PREPS.has(nextLow)) score -= 1;
  if (ARTICLES.has(nextLow)) score -= 3;
  if (next && next.length <= 2) score -= 2;
  return score;
}

function grammarReflow(text, minWords, maxWords, maxChars) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const min = Math.max(1, Math.min(minWords, maxWords));
  const max = Math.max(min, Math.max(minWords, maxWords));
  const charLimit = Math.max(20, maxChars);
  const lines = [];
  let i = 0;
  while (i < words.length) {
    const remaining = words.length - i;
    if (remaining <= max) {
      lines.push(words.slice(i).join(" "));
      break;
    }

    let bestScore = -Infinity;
    let bestEnd = i + max;
    for (let j = i + min - 1; j < Math.min(i + max, words.length - 1); j++) {
      const candidate = words.slice(i, j + 1).join(" ");
      if (candidate.length > charLimit) break;
      const s = scoreBreakPoint(words, j);
      if (s > bestScore) {
        bestScore = s;
        bestEnd = j + 1;
      }
    }

    while (
      bestEnd > i + min &&
      words.slice(i, bestEnd).join(" ").length > charLimit
    )
      bestEnd--;
    lines.push(words.slice(i, bestEnd).join(" "));
    i = bestEnd;
  }
  return lines.length > 0 ? lines : [""];
}

function reflowByCharLimit(text, minWords, maxWords, maxChars) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const min = Math.max(1, Math.min(minWords, maxWords));
  const max = Math.max(min, Math.max(minWords, maxWords));
  const charLimit = Math.max(20, maxChars);

  const lines = [];
  let i = 0;
  while (i < words.length) {
    let line = "";
    let wordCount = 0;
    const start = i;

    while (i < words.length && wordCount < max) {
      const testLine = line ? `${line} ${words[i]}` : words[i];
      if (testLine.length <= charLimit && wordCount < max) {
        line = testLine;
        wordCount++;
        i++;
      } else if (wordCount < min) {
        line = testLine;
        wordCount++;
        i++;
      } else {
        break;
      }
    }

    if (line) lines.push(line);
    if (i === start && i < words.length) {
      lines.push(words[i]);
      i++;
    }
  }

  return lines.length > 0 ? lines : [""];
}

function smartRegroup(
  blocks,
  minWords,
  maxWords,
  maxChars,
  minDuration,
  useGrammar
) {
  const allWords = [];
  const timings = [];

  for (const b of blocks) {
    const text = b.text.join(" ").trim();
    const words = text.split(/\s+/).filter(Boolean);
    const start = b.start ?? 0;
    const end = b.end ?? start + 1;

    for (const word of words) {
      allWords.push(word);
      timings.push({ start, end });
    }
  }

  if (allWords.length === 0) return blocks;

  const min = Math.max(1, Math.min(minWords, maxWords));
  const max = Math.max(min, Math.max(minWords, maxWords));
  const charLimit = Math.max(20, maxChars);

  const newBlocks = [];
  let i = 0;
  let cueStart = timings[0]?.start ?? 0;

  while (i < allWords.length) {
    const remaining = allWords.length - i;
    let take;

    if (useGrammar && remaining > max) {
      let bestScore = -Infinity;
      let bestEnd = Math.min(i + max, allWords.length);
      for (let j = i + min - 1; j < Math.min(i + max, allWords.length - 1); j++) {
        const candidate = allWords.slice(i, j + 1).join(" ");
        if (candidate.length > charLimit) break;
        const s = scoreBreakPoint(allWords, j);
        if (s > bestScore) {
          bestScore = s;
          bestEnd = j + 1;
        }
      }
      while (
        bestEnd > i + min &&
        allWords.slice(i, bestEnd).join(" ").length > charLimit
      )
        bestEnd--;
      take = bestEnd - i;
    } else {
      take = 0;
      while (take < max && i + take < allWords.length) {
        const testLine = allWords.slice(i, i + take + 1).join(" ");
        if (testLine.length > charLimit && take >= min) break;
        take++;
      }
      take = Math.max(min, take);
    }

    take = Math.min(take, allWords.length - i);
    if (take === 0) take = 1;

    const line = allWords.slice(i, i + take).join(" ");
    const cueEnd = Math.max(
      cueStart + minDuration,
      timings[Math.min(i + take - 1, timings.length - 1)]?.end ?? cueStart + 1
    );

    newBlocks.push({
      timestamp: `${toTimestamp(cueStart)} --> ${toTimestamp(cueEnd)}`,
      start: cueStart,
      end: cueEnd,
      text: [line],
    });
    cueStart = cueEnd;
    i += take;
  }

  return newBlocks.length > 0 ? newBlocks : blocks;
}

export function applyRules(blocks, opts) {
  let workingBlocks = blocks;

  if (opts.smartRegroup) {
    workingBlocks = smartRegroup(
      blocks,
      opts.wordsPerLineMin,
      opts.wordsPerLineMax,
      opts.maxCharsPerLine,
      opts.minCueSeconds,
      opts.grammarSplit
    );
  }

  return workingBlocks.map((b, i) => {
    let lines = [...b.text];

    if (opts.limitWordsPerLine && !opts.smartRegroup) {
      lines = opts.grammarSplit
        ? grammarReflow(
            lines.join(" "),
            opts.wordsPerLineMin,
            opts.wordsPerLineMax,
            opts.maxCharsPerLine
          )
        : reflowByCharLimit(
            lines.join(" "),
            opts.wordsPerLineMin,
            opts.wordsPerLineMax,
            opts.maxCharsPerLine
          );
    } else if (opts.singleLine) {
      lines = [lines.join(" ")];
    }

    lines = lines.map((line) => {
      if (opts.removePeriods) line = line.replace(/\./g, "");
      if (opts.removeCommas) line = line.replace(/,/g, "");
      if (opts.removeQuestions) line = line.replace(/\?/g, "");
      if (opts.removeExclamations) line = line.replace(/!/g, "");
      if (opts.stripSpaces) line = line.replace(/\s+/g, " ").trim();
      if (opts.allCaps) line = line.toUpperCase();
      return line;
    });

    return { index: i + 1, timestamp: b.timestamp, text: lines };
  });
}

export function formatSRT(processed) {
  return (
    processed
      .map((b) => `${b.index}\n${b.timestamp}\n${b.text.join("\n")}`)
      .join("\n\n") + "\n"
  );
}
