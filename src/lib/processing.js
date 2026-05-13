export const PROCESSING_MODES = {
  CLEAN: "clean",
  REGROUP: "regroup",
};

export function normalizeProcessingMode(mode) {
  return mode === PROCESSING_MODES.REGROUP
    ? PROCESSING_MODES.REGROUP
    : PROCESSING_MODES.CLEAN;
}

export function sanitizeProcessingOptions(opts = {}, mode = PROCESSING_MODES.CLEAN) {
  if (normalizeProcessingMode(mode) !== PROCESSING_MODES.CLEAN) return opts;

  return {
    ...opts,
    smartRegroup: false,
    grammarSplit: false,
    limitWordsPerLine: false,
  };
}
