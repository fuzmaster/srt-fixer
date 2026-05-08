import { describe, it, expect } from "vitest";
import { parseSRT, applyRules, formatSRT } from "./srt-engine.js";

// ─── helpers ──────────────────────────────────────────────────────────────────

const BASIC_SRT = `1
00:00:01,000 --> 00:00:03,500
Hello, world.

2
00:00:04,000 --> 00:00:06,200
This is a test.`;

const CLEAN_OPTS = {
  removePeriods: false, removeCommas: false, removeQuestions: false, removeExclamations: false,
  allCaps: false, stripSpaces: false, singleLine: false,
  limitWordsPerLine: false, smartRegroup: false, grammarSplit: false,
  wordsPerLineMin: 3, wordsPerLineMax: 7, maxCharsPerLine: 42, minCueSeconds: 0.5,
};

// ─── parseSRT ─────────────────────────────────────────────────────────────────

describe("parseSRT", () => {
  it("parses a basic SRT with two blocks", () => {
    const { blocks, error } = parseSRT(BASIC_SRT);
    expect(error).toBeNull();
    expect(blocks).toHaveLength(2);
  });

  it("parses timestamps correctly", () => {
    const { blocks } = parseSRT(BASIC_SRT);
    expect(blocks[0].start).toBeCloseTo(1.0);
    expect(blocks[0].end).toBeCloseTo(3.5);
    expect(blocks[1].start).toBeCloseTo(4.0);
    expect(blocks[1].end).toBeCloseTo(6.2);
  });

  it("preserves original timestamp strings", () => {
    const { blocks } = parseSRT(BASIC_SRT);
    expect(blocks[0].timestamp).toBe("00:00:01,000 --> 00:00:03,500");
    expect(blocks[1].timestamp).toBe("00:00:04,000 --> 00:00:06,200");
  });

  it("handles CRLF line endings", () => {
    const crlf = BASIC_SRT.replace(/\n/g, "\r\n");
    const { blocks, error } = parseSRT(crlf);
    expect(error).toBeNull();
    expect(blocks).toHaveLength(2);
  });

  it("handles CR-only line endings", () => {
    const cr = BASIC_SRT.replace(/\n/g, "\r");
    const { blocks, error } = parseSRT(cr);
    expect(error).toBeNull();
    expect(blocks).toHaveLength(2);
  });

  it("handles missing index numbers", () => {
    const noIndex = `00:00:01,000 --> 00:00:03,500\nHello.\n\n00:00:04,000 --> 00:00:06,200\nWorld.`;
    const { blocks, error } = parseSRT(noIndex);
    expect(error).toBeNull();
    expect(blocks).toHaveLength(2);
  });

  it("handles non-sequential index numbers", () => {
    const weirdIdx = `99\n00:00:01,000 --> 00:00:03,500\nHello.\n\n5\n00:00:04,000 --> 00:00:06,200\nWorld.`;
    const { blocks, error } = parseSRT(weirdIdx);
    expect(error).toBeNull();
    expect(blocks).toHaveLength(2);
  });

  it("returns error for empty input", () => {
    const { blocks, error } = parseSRT("");
    expect(error).toBeTruthy();
    expect(blocks).toHaveLength(0);
  });

  it("returns error for whitespace-only input", () => {
    const { blocks, error } = parseSRT("   \n\n  ");
    expect(error).toBeTruthy();
    expect(blocks).toHaveLength(0);
  });

  it("returns error for input with no valid SRT blocks", () => {
    const { blocks, error } = parseSRT("This is just a plain text file.");
    expect(error).toBeTruthy();
    expect(blocks).toHaveLength(0);
  });

  it("handles multi-line subtitle text", () => {
    const multi = `1\n00:00:01,000 --> 00:00:03,500\nLine one\nLine two\nLine three`;
    const { blocks } = parseSRT(multi);
    expect(blocks[0].text).toHaveLength(3);
    expect(blocks[0].text[0]).toBe("Line one");
    expect(blocks[0].text[2]).toBe("Line three");
  });

  it("does not crash on a very long subtitle text", () => {
    const longText = "word ".repeat(500).trim();
    const long = `1\n00:00:01,000 --> 00:00:03,500\n${longText}`;
    expect(() => parseSRT(long)).not.toThrow();
  });

  it("handles malformed blocks mixed with valid ones", () => {
    const mixed = `1\n00:00:01,000 --> 00:00:03,500\nGood block\n\nnot valid\n\n2\n00:00:04,000 --> 00:00:06,000\nAnother good block`;
    const { blocks } = parseSRT(mixed);
    expect(blocks.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── Clean Text Only — timestamp + cue preservation ───────────────────────────

describe("Clean Text Only mode (smartRegroup: false)", () => {
  it("preserves cue count exactly", () => {
    const { blocks } = parseSRT(BASIC_SRT);
    const processed = applyRules(blocks, CLEAN_OPTS);
    expect(processed).toHaveLength(blocks.length);
  });

  it("preserves every timestamp string exactly", () => {
    const { blocks } = parseSRT(BASIC_SRT);
    const processed = applyRules(blocks, CLEAN_OPTS);
    processed.forEach((p, i) => {
      expect(p.timestamp).toBe(blocks[i].timestamp);
    });
  });

  it("preserves cue order", () => {
    const { blocks } = parseSRT(BASIC_SRT);
    const processed = applyRules(blocks, CLEAN_OPTS);
    processed.forEach((p, i) => {
      expect(p.timestamp).toBe(blocks[i].timestamp);
    });
  });

  it("removes periods when removePeriods is true", () => {
    const { blocks } = parseSRT(BASIC_SRT);
    const processed = applyRules(blocks, { ...CLEAN_OPTS, removePeriods: true });
    const allText = processed.map(b => b.text.join(" ")).join(" ");
    expect(allText).not.toContain(".");
  });

  it("removes commas when removeCommas is true", () => {
    const srt = `1\n00:00:01,000 --> 00:00:03,500\nHello, world, foo.`;
    const { blocks } = parseSRT(srt);
    const processed = applyRules(blocks, { ...CLEAN_OPTS, removeCommas: true });
    expect(processed[0].text.join(" ")).not.toContain(",");
  });

  it("removes question marks when removeQuestions is true", () => {
    const srt = `1\n00:00:01,000 --> 00:00:03,500\nReally? Are you sure?`;
    const { blocks } = parseSRT(srt);
    const processed = applyRules(blocks, { ...CLEAN_OPTS, removeQuestions: true });
    expect(processed[0].text.join(" ")).not.toContain("?");
  });

  it("removes exclamation marks when removeExclamations is true", () => {
    const srt = `1\n00:00:01,000 --> 00:00:03,500\nWow! Amazing!`;
    const { blocks } = parseSRT(srt);
    const processed = applyRules(blocks, { ...CLEAN_OPTS, removeExclamations: true });
    expect(processed[0].text.join(" ")).not.toContain("!");
  });

  it("converts text to ALL CAPS when allCaps is true", () => {
    const { blocks } = parseSRT(BASIC_SRT);
    const processed = applyRules(blocks, { ...CLEAN_OPTS, allCaps: true });
    const allText = processed.map(b => b.text.join(" ")).join(" ");
    expect(allText).toBe(allText.toUpperCase());
  });

  it("strips extra whitespace when stripSpaces is true", () => {
    const srt = `1\n00:00:01,000 --> 00:00:03,500\nHello   world   foo`;
    const { blocks } = parseSRT(srt);
    const processed = applyRules(blocks, { ...CLEAN_OPTS, stripSpaces: true });
    expect(processed[0].text[0]).toBe("Hello world foo");
  });

  it("collapses multi-line cue to single line when singleLine is true — without changing timestamp", () => {
    const srt = `1\n00:00:01,000 --> 00:00:03,500\nLine one\nLine two`;
    const { blocks } = parseSRT(srt);
    const processed = applyRules(blocks, { ...CLEAN_OPTS, singleLine: true });
    expect(processed[0].text).toHaveLength(1);
    expect(processed[0].text[0]).toBe("Line one Line two");
    // timestamp unchanged
    expect(processed[0].timestamp).toBe(blocks[0].timestamp);
  });

  it("does not change timestamps even when all text opts are enabled", () => {
    const { blocks } = parseSRT(BASIC_SRT);
    const aggressiveClean = {
      ...CLEAN_OPTS,
      removePeriods: true, removeCommas: true, removeQuestions: true, removeExclamations: true,
      allCaps: true, stripSpaces: true, singleLine: true,
    };
    const processed = applyRules(blocks, aggressiveClean);
    processed.forEach((p, i) => {
      expect(p.timestamp).toBe(blocks[i].timestamp);
    });
  });

  it("renumbers cue indexes starting from 1", () => {
    const { blocks } = parseSRT(BASIC_SRT);
    const processed = applyRules(blocks, CLEAN_OPTS);
    expect(processed[0].index).toBe(1);
    expect(processed[1].index).toBe(2);
  });
});

// ─── Regroup mode — separate from Clean Text Only ─────────────────────────────

describe("Regroup Captions mode (smartRegroup: true)", () => {
  const REGROUP_OPTS = {
    ...CLEAN_OPTS,
    smartRegroup: true, grammarSplit: true,
    wordsPerLineMin: 2, wordsPerLineMax: 3,
    minCueSeconds: 0.5,
  };

  const MULTI_BLOCK_SRT = `1
00:00:01,000 --> 00:00:02,000
This is the first block with several words.

2
00:00:02,000 --> 00:00:03,500
And here is a second block.`;

  it("may produce a different cue count than the input", () => {
    const { blocks } = parseSRT(MULTI_BLOCK_SRT);
    const processed = applyRules(blocks, REGROUP_OPTS);
    // With 2-3 words max and many words, output will have more cues
    expect(processed.length).not.toBe(blocks.length);
  });

  it("preserves all words in output (no words dropped)", () => {
    const { blocks } = parseSRT(MULTI_BLOCK_SRT);
    const inputWords = blocks.flatMap(b => b.text.join(" ").split(/\s+/)).filter(Boolean).length;
    const processed = applyRules(blocks, REGROUP_OPTS);
    const outputWords = processed.flatMap(b => b.text.join(" ").split(/\s+/)).filter(Boolean).length;
    expect(outputWords).toBe(inputWords);
  });

  it("does not crash on a single-block SRT", () => {
    const single = `1\n00:00:01,000 --> 00:00:05,000\nHello world.`;
    const { blocks } = parseSRT(single);
    expect(() => applyRules(blocks, REGROUP_OPTS)).not.toThrow();
  });
});

// ─── formatSRT ────────────────────────────────────────────────────────────────

describe("formatSRT", () => {
  it("produces valid SRT output", () => {
    const { blocks } = parseSRT(BASIC_SRT);
    const processed = applyRules(blocks, CLEAN_OPTS);
    const output = formatSRT(processed);
    expect(typeof output).toBe("string");
    expect(output).toContain("-->");
    expect(output.trim().length).toBeGreaterThan(0);
  });

  it("round-trips a file through parse→apply→format with no text changes when no opts enabled", () => {
    const { blocks } = parseSRT(BASIC_SRT);
    const processed = applyRules(blocks, CLEAN_OPTS);
    const output = formatSRT(processed);
    // Output should contain the original text
    expect(output).toContain("Hello, world.");
    expect(output).toContain("This is a test.");
  });

  it("output re-parses correctly", () => {
    const { blocks } = parseSRT(BASIC_SRT);
    const processed = applyRules(blocks, { ...CLEAN_OPTS, allCaps: true });
    const output = formatSRT(processed);
    const { blocks: reparsed, error } = parseSRT(output);
    expect(error).toBeNull();
    expect(reparsed).toHaveLength(2);
  });
});
