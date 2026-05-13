# SRT Fixer

A deterministic web utility for cleaning messy `.srt` subtitle files for short-form editing workflows.

This project is built for editors who use Premiere Pro, After Effects, Riverside, Descript, and similar tools, then waste time manually fixing punctuation, casing, and line breaks before cutting Reels, Shorts, TikToks, and podcast clips.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building

Build for production:

```bash
npm run build
```

The output will be in the `dist/` directory.

On Windows, `npm run build` and `npm test` need permission to spawn the Vite/Vitest child processes used by the toolchain.

### Preview Production Build

```bash
npm run preview
```

## Features

### Processing Modes

**Clean Text Only** (default)

Safest mode. Keeps every original timestamp, cue count, cue order, and cue break exactly as-is. Only subtitle text is modified.

**Regroup Captions** (advanced)

May rebuild caption grouping and change cue timing. Use only when you want the app to redistribute words across cues. Always shows a warning before use.

### Core Features
- Upload `.srt` file or paste raw SRT text
- Remove periods, commas, question marks, exclamation marks
- Convert subtitle text to ALL CAPS
- Force one line per subtitle cue (Clean Text Only mode)
- Strip extra spaces
- Show before/after preview
- Download cleaned `.srt`
- Batch process up to 50 files (Pro)

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: JavaScript (JSX)

## Deployment

This project is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel and it will automatically build and deploy on every push to `main`.

## License

MIT
