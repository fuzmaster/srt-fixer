# SRT Fixer

[![License](https://img.shields.io/badge/license-proprietary-lightgrey.svg)](#license)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#verification)
[![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)](package.json)

Clean messy `.srt` subtitle files before you burn captions into Reels, Shorts, TikToks, podcast clips, and client edits. SRT Fixer turns awkward auto-caption exports into cleaner, tighter, editor-ready subtitle files directly in the browser.

## Why This Exists

Auto-caption tools are useful, but their exported `.srt` files often need cleanup before publishing: extra punctuation, inconsistent casing, awkward cue text, and line breaks that look clunky once captions are burned into a video.

SRT Fixer is built for the moment after transcription and before publishing. It does not generate captions from audio or video. It cleans existing `.srt` files so editors can move faster from rough caption export to publish-ready subtitles.

## Features

- Upload a `.srt` file or paste raw subtitle text.
- Remove punctuation from captions.
- Convert caption text to ALL CAPS.
- Strip extra whitespace.
- Force cleaner single-line captions.
- Preserve timestamps, cue order, and cue breaks in **Clean Text Only** mode.
- Regroup captions by word count, character count, grammar-aware splits, and minimum cue duration.
- Preview original and cleaned subtitles side by side.
- Download a cleaned `.srt` file.
- Process cleanup locally in the browser using a Web Worker.
- Batch process up to 50 `.srt` files in Pro.
- Download Pro batch output as a ZIP.
- Snap Pro subtitle timestamps to common project framerates.
- Activate Pro with Gumroad license keys.
- Includes Remotion scripts for creating vertical promo reels.

## Use The App

Open the hosted tool:

**https://srt-fixer-eight.vercel.app/**

Free workflow:

1. Upload a `.srt` file or paste subtitle text.
2. Choose **Clean Text Only** for timestamp-safe cleanup.
3. Toggle punctuation, casing, spacing, and line-break options.
4. Preview the result.
5. Download the cleaned `.srt` file.

Pro workflow:

1. Buy SRT Fixer Pro on Gumroad.
2. Copy the license key from the Gumroad receipt.
3. Open **BatchPro** in SRT Fixer.
4. Paste the license key and activate Pro.
5. Batch process up to 50 `.srt` files.
6. Download the cleaned files as a ZIP.

## Example

Input:

```srt
1
00:00:01,000 --> 00:00:03,500
Hello, world. Welcome to the video!

2
00:00:04,000 --> 00:00:06,200
This is a messy auto-caption.
```

Cleaned output:

```srt
1
00:00:01,000 --> 00:00:03,500
HELLO WORLD WELCOME TO THE VIDEO

2
00:00:04,000 --> 00:00:06,200
THIS IS A MESSY AUTO-CAPTION
```

## Supported Workflows

SRT Fixer is designed for caption files exported from tools such as:

- CapCut
- Premiere Pro
- DaVinci Resolve
- Final Cut Pro
- YouTube Studio
- Podcast clipping workflows
- Short-form video production pipelines

## Tech Stack

- React 18
- Vite 5
- JavaScript / JSX
- Web Workers
- Vitest
- JSZip
- Vercel serverless functions
- Gumroad license verification
- Remotion for vertical promo reels
- Vercel Analytics

## Configuration

SRT Fixer Pro currently uses Gumroad for checkout and license verification.

Key production variables:

```env
VITE_GUMROAD_CHECKOUT_URL=https://jbritten.gumroad.com/l/srt-fixer-pro
GUMROAD_PRODUCT_ID=replace-with-your-gumroad-product-id
GUMROAD_PRODUCT_PERMALINK=srt-fixer-pro
```

Optional legacy/fallback integrations remain available in the codebase for Stripe, Lemon Squeezy, Redis-backed internal licenses, and Resend email delivery.

## Local Development

This repository is primarily built for the hosted app, but the local development workflow is standard Vite:

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm test
npm run build
npm run remotion:preview
npm run remotion:render
```

## Verification

Current checks:

- `npm test`
- `npm run build`

The subtitle parser/cleaner test suite currently covers timestamp parsing, cue validation, text cleanup, regrouping behavior, and edge cases around malformed SRT content.

## Roadmap

- More export guides for editing apps.
- More Pro batch presets.
- Better multi-speaker transcript cleanup.
- EDL/transcript workflow support.
- More Remotion ad templates for social launch testing.

## Support

For questions, feature requests, or licensing help, use the contact form on the SRT Fixer website or reach out through the Gumroad purchase page.

## License

All rights reserved unless a separate license file states otherwise.
