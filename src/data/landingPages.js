const SITE_URL = "https://srt-fixer-eight.vercel.app";

export const DEFAULT_SEO = {
  path: "/",
  metaTitle: "SRT Fixer | Clean Subtitle Files for Reels, Shorts, and Podcast Clips",
  metaDescription:
    "Free browser-based SRT cleaner for video editors. Remove punctuation, fix casing, clean line breaks, and download a polished .srt file. Nothing uploaded. No account needed.",
  heroLead: "Clean and fix .SRT subtitle files",
  heroAccent: "before you burn them into reels",
  heroCopy:
    "Remove punctuation, fix casing, clean line breaks, and download a polished .srt file. This formats existing subtitles, it does not transcribe audio or video.",
};

export const LANDING_PAGES = {
  "/capcut-srt-cleaner": {
    path: "/capcut-srt-cleaner",
    navLabel: "CapCut SRT Cleaner",
    metaTitle: "CapCut SRT Cleaner | Fix Captions Before Reels, TikToks, and Shorts",
    metaDescription:
      "Clean exported CapCut .srt files in your browser. Remove punctuation, fix line breaks, preserve timestamps, and prep captions for burn-in.",
    heroLead: "Clean CapCut .SRT captions",
    heroAccent: "before you burn them into short-form edits",
    heroCopy:
      "Export your CapCut captions, drop the .srt here, and clean punctuation, spacing, casing, and line breaks without uploading the file anywhere.",
    intentTitle: "CapCut captions are fast, but the exported SRT is rarely burn-in ready.",
    intentCopy:
      "CapCut auto-captions often ship with tiny punctuation marks, awkward wraps, and inconsistent spacing. SRT Fixer turns that rough export into cleaner captions you can re-import or burn into vertical edits.",
    bullets: [
      "Strip punctuation from CapCut captions in one click",
      "Preserve the original SRT timing in Clean Text Only mode",
      "Use Regroup mode when you want tighter short-form caption chunks",
    ],
    steps: [
      "Export captions from CapCut as an .srt file.",
      "Drop the file into SRT Fixer and choose Clean Text Only for timestamp-safe cleanup.",
      "Download the cleaned .srt and bring it back into your edit.",
    ],
    faq: {
      q: "Does this generate captions from CapCut videos?",
      a: "No. It cleans an existing .srt export. Generate or export the captions in CapCut first, then use SRT Fixer to polish the text.",
    },
  },
  "/remove-punctuation-from-srt": {
    path: "/remove-punctuation-from-srt",
    navLabel: "Remove SRT Punctuation",
    metaTitle: "Remove Punctuation from SRT Files Online | Private Browser Tool",
    metaDescription:
      "Remove periods, commas, question marks, and exclamation points from SRT subtitle files online. Runs locally in your browser.",
    heroLead: "Remove punctuation from .SRT files",
    heroAccent: "without breaking subtitle timestamps",
    heroCopy:
      "Clean auto-caption punctuation for Reels, Shorts, TikToks, and podcast clips while keeping your original cue timing intact.",
    intentTitle: "Tiny punctuation marks can make burned-in captions look messy.",
    intentCopy:
      "Short-form captions usually read better when they feel like clean visual text, not a transcript. This page is for editors who already have an SRT and just need the punctuation gone quickly.",
    bullets: [
      "Remove periods, commas, question marks, and exclamation points",
      "Keep cue order and timing untouched in Clean Text Only mode",
      "Download a fresh .cleaned.srt file immediately",
    ],
    steps: [
      "Upload or paste your existing .srt content.",
      "Leave Strip Punctuation enabled.",
      "Preview the cleaned output and download the result.",
    ],
    faq: {
      q: "Will removing punctuation change my subtitles timing?",
      a: "No in Clean Text Only mode. It changes only the caption text, not the timestamps or cue structure.",
    },
  },
  "/fix-subtitle-line-breaks": {
    path: "/fix-subtitle-line-breaks",
    navLabel: "Fix Line Breaks",
    metaTitle: "Fix SRT Subtitle Line Breaks | Clean One-Line Captions Online",
    metaDescription:
      "Fix messy SRT subtitle line breaks and clean captions for burn-in. Collapse awkward auto-caption wrapping in a private browser workflow.",
    heroLead: "Fix messy SRT line breaks",
    heroAccent: "for cleaner captions on screen",
    heroCopy:
      "Collapse awkward subtitle wrapping, clean spacing, and prep SRT captions for vertical videos without sending client files to a server.",
    intentTitle: "Bad line breaks make captions look amateur even when the edit is solid.",
    intentCopy:
      "Auto-caption exports often split a sentence in the wrong place. SRT Fixer helps you clean one-off files safely, and Pro adds batch workflows for full content calendars.",
    bullets: [
      "Clean extra whitespace and awkward caption wrapping",
      "Use single-line cleanup for timestamp-safe formatting",
      "Use Regroup mode for tighter captions when timing changes are acceptable",
    ],
    steps: [
      "Upload the subtitle file exported from your editor.",
      "Use Clean Text Only if you need exact timestamp preservation.",
      "Switch to Regroup Captions only when you want to rebuild caption chunks.",
    ],
    faq: {
      q: "Can line-break cleanup change timing?",
      a: "Clean Text Only keeps timing intact. Regroup Captions is the advanced mode that can intentionally rebuild cue timing.",
    },
  },
  "/youtube-caption-cleaner": {
    path: "/youtube-caption-cleaner",
    navLabel: "YouTube Caption Cleaner",
    metaTitle: "YouTube Caption Cleaner | Clean Downloaded SRT Auto Captions",
    metaDescription:
      "Clean YouTube Studio SRT caption downloads for Shorts, clips, and podcast edits. Remove punctuation and polish line breaks locally.",
    heroLead: "Clean YouTube SRT captions",
    heroAccent: "before turning long-form into clips",
    heroCopy:
      "Download your YouTube captions as SRT, clean the transcript-style formatting, and reuse the captions for Shorts, Reels, and podcast clips.",
    intentTitle: "YouTube captions are built for accessibility, not always for stylish burn-in captions.",
    intentCopy:
      "When you repurpose long-form videos into clips, downloaded YouTube captions often need a fast visual cleanup pass. This keeps the words deterministic while removing formatting friction.",
    bullets: [
      "Clean downloaded YouTube Studio .srt files",
      "Remove transcript-style punctuation for burn-in captions",
      "Keep processing local for private or client-owned content",
    ],
    steps: [
      "Open YouTube Studio and download captions as an .srt file.",
      "Upload the SRT to SRT Fixer.",
      "Download the cleaned file and import it into your clip editing workflow.",
    ],
    faq: {
      q: "Does this rewrite YouTube auto captions?",
      a: "No. It applies deterministic formatting only. It does not paraphrase, summarize, or use AI to change the words.",
    },
  },
};

export const LANDING_PATHS = Object.keys(LANDING_PAGES);

export function getLandingPage(pathname) {
  return LANDING_PAGES[pathname] || null;
}

export function pageUrl(path = "/") {
  return `${SITE_URL}${path === "/" ? "/" : path}`;
}
