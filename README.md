# SRT Fixer

[![License](https://img.shields.io/badge/license-proprietary-lightgrey.svg)](#license)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#use-srt-fixer)
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
- Snap subtitle timestamps to project framerates in Pro mode.
- Apply positive or negative millisecond offsets in Pro mode.
- Batch process up to 50 `.srt` files and download a ZIP in Pro mode.
- Validate, activate, and deactivate Pro licenses through a serverless API endpoint.

## Use SRT Fixer

SRT Fixer is designed as a hosted browser tool. Open the app, drop in an `.srt` file or paste subtitle text, choose your cleanup settings, preview the result, and download the cleaned file.

### Free Cleanup Workflow

1. Open SRT Fixer in your browser.
2. Upload a `.srt` file or paste raw subtitle text.
3. Choose **Clean Text Only** to preserve original timestamps.
4. Toggle punctuation, casing, spacing, and line-break cleanup options.
5. Preview the cleaned subtitles.
6. Download the polished `.srt` file.

### Pro Batch Workflow

SRT Fixer Pro is built for editors, agencies, and content teams cleaning many subtitle files at once.

1. Activate a Pro license.
2. Add up to 50 `.srt` files.
3. Choose a cleanup preset across the full batch.
4. Optionally snap cue timing to `23.976`, `24`, `25`, `29.97`, `30`, `50`, `59.94`, or `60` fps.
5. Apply a subtitle offset in milliseconds when a timeline needs nudging.
6. Process everything locally in the browser.
7. Download all cleaned files as a ZIP.

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

## Support & Pro

SRT Fixer Pro adds batch processing for high-volume subtitle cleanup workflows. It is intended for creators and teams who want consistent caption formatting across an entire project without manually processing files one by one.

For product support, feature requests, or Pro licensing questions, use the contact path provided with your license or product page.

## License

All rights reserved unless a separate license file states otherwise.
