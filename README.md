# SRT Fixer

A deterministic web utility for cleaning messy `.srt` subtitle files for short-form editing workflows.

This project is built for editors who use Premiere Pro, After Effects, Riverside, Descript, and similar tools, then waste time manually fixing punctuation, casing, and line breaks before cutting Reels, Shorts, TikToks, and podcast clips.

## Getting Started

### Prerequisites

- Node.js 16+ 
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

### Preview Production Build

```bash
npm run preview
```

## Features

### Core Features
- Upload `.srt` file
- Paste raw SRT text
- Remove periods and commas
- Convert subtitle text to ALL CAPS
- Force one line per subtitle cue
- Strip extra spaces
- Preserve timestamps exactly
- Show before/after preview
- Download cleaned `.srt`

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: JavaScript (JSX)

## Deployment

This project is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel and it will automatically build and deploy on every push to `main`.

## License

MIT
