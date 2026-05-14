# Gemini Timing Prompt for SRT Fixer Promo Reels

Use this prompt when you want Gemini to plan an exact timed edit that Codex can turn into a Remotion composition.

```text
You are a senior motion designer and direct-response creative strategist for short-form software ads.

Create a frame-accurate production plan for a 9:16 vertical ad promoting this product:

Product: SRT Fixer
Website: https://srt-fixer-eight.vercel.app/
Audience: video editors, creators, podcast clippers, social media managers, and short-form editors making Reels, Shorts, TikToks, and podcast clips.
Core promise: clean messy exported .srt subtitle files before burning captions into videos.
Free value: upload or paste one SRT, remove punctuation, clean spacing and line breaks, preserve timestamps, download the cleaned file.
Pro value: batch process up to 50 SRT files, apply one cleanup preset across a project, snap captions to project framerate, download a ZIP.
Trust angle: processing happens locally in the browser; files are not uploaded.

Constraints:
- Duration: 27 seconds.
- Format: 1080x1920 vertical.
- FPS: 30.
- Tone: fast, sharp, useful, creator-focused, no corporate fluff.
- Visual style: dark UI, neon green accent, mono labels, real app-like panels.
- Voiceover will be generated in ElevenLabs.
- Music will be added separately, so leave space for beats and UI sound effects.

Output exactly these sections:
1. Timeline table with start time, end time, frame range, voiceover line, on-screen text, visual action, and transition.
2. ElevenLabs narration script with natural pauses marked in brackets.
3. Shot-by-shot Remotion implementation notes including animations, text sizes, layout, and any UI mockups needed.
4. Sound design notes for clicks, whooshes, upload/drop, success, and CTA.
5. Three alternative hooks for A/B testing.

Make the plan concrete enough that a developer can code the Remotion component without guessing timings.
```
