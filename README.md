# SRT Fixer

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](#license)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#quick-start--installation)
[![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)](package.json)

Clean messy `.srt` subtitle files for Reels, Shorts, TikToks, and podcast clips without uploading your captions anywhere. SRT Fixer removes punctuation, fixes casing, cleans line breaks, and downloads polished subtitle files directly from your browser.

## The Problem/Solution

Auto-generated captions from editing and recording tools often arrive with awkward punctuation, inconsistent casing, messy line breaks, and subtitle cues that need cleanup before burn-in. Manually fixing those files with find-and-replace is slow, repetitive, and easy to mess up.

SRT Fixer is a deterministic browser utility for editors who want fast, repeatable subtitle cleanup. In Clean Text Only mode, it preserves original timestamps, cue count, cue order, and cue breaks while only changing subtitle text. For advanced workflows, Regroup Captions can redistribute words across cues with a clear timing warning.

## Features

- Upload a `.srt` file or paste raw SRT text.
- Remove periods, commas, question marks, and exclamation marks.
- Convert captions to ALL CAPS.
- Strip extra whitespace.
- Force one-line captions while preserving original timestamps in Clean Text Only mode.
- Regroup captions by word count, character count, grammar-aware splits, and minimum cue duration.
- Preview original and cleaned subtitles side by side.
- Download a cleaned `.srt` file.
- Process files locally in the browser with a Web Worker.
- Validate malformed SRT timestamps and invalid cue ranges.
- Batch process up to 50 `.srt` files and download a ZIP in Pro mode.
- Validate, activate, and deactivate Pro licenses through a serverless API endpoint.

## Quick Start / Installation

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
git clone https://github.com/fuzmaster/srt-fixer.git
cd srt-fixer
npm install
```

### Run Locally

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Test

```bash
npm test
```

### Build

```bash
npm run build
```

The production output is written to `dist/`.

### Preview The Production Build

```bash
npm run preview
```

On Windows, `npm run build` and `npm test` need permission to spawn the Vite/Vitest child processes used by the toolchain.

## Usage Example

Paste or upload an SRT file:

```srt
1
00:00:01,000 --> 00:00:03,500
Hello, world. Welcome to the video!

2
00:00:04,000 --> 00:00:06,200
This is a messy auto-caption.
```

Enable cleanup options such as **Strip Punctuation**, **ALL CAPS**, or **Force single line**, then download the cleaned subtitle file:

```srt
1
00:00:01,000 --> 00:00:03,500
HELLO WORLD WELCOME TO THE VIDEO

2
00:00:04,000 --> 00:00:06,200
THIS IS A MESSY AUTO-CAPTION
```

For timestamp-safe cleanup, use **Clean Text Only**. For redistributed caption blocks, use **Regroup Captions**.

## Tech Stack

- React 18
- Vite 5
- JavaScript / JSX
- Web Workers
- Vitest
- JSZip
- Vercel serverless functions
- Lemon Squeezy license API integration

## Contributing

Contributions are welcome. To propose a change:

1. Fork the repository.
2. Create a feature branch.
3. Run `npm test` and `npm run build`.
4. Open a pull request with a clear description of the change.

Please keep changes focused, preserve deterministic subtitle output, and add tests for parser or processing behavior changes.

## License

MIT. See the repository license for details.
