import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const colors = {
  bg: "#08080A",
  surface: "#141418",
  surface2: "#1A1A20",
  border: "#252530",
  text: "#E8E8EE",
  muted: "#A0A0B0",
  green: "#34D399",
};

const fontStack = "DM Sans, Inter, Arial, sans-serif";
const monoStack = "JetBrains Mono, Menlo, Consolas, monospace";

function easeIn(frame, delay = 0, duration = 18, from = 24) {
  return {
    opacity: interpolate(frame, [delay, delay + duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    transform: `translateY(${interpolate(frame, [delay, delay + duration], [from, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
  };
}

function Grain() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(52,211,153,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(52,211,153,.045) 1px,transparent 1px)",
        backgroundSize: "72px 72px",
        opacity: 0.72,
      }}
    />
  );
}

function Brand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ background: colors.green, color: "#000", padding: "7px 13px", borderRadius: 7, fontFamily: monoStack, fontWeight: 900, fontSize: 26 }}>
        .srt
      </div>
      <div style={{ fontFamily: monoStack, fontWeight: 800, fontSize: 27, color: colors.text }}>SRT Fixer</div>
    </div>
  );
}

function CaptionCard({ label, children, active }) {
  return (
    <div
      style={{
        background: active ? "linear-gradient(180deg, rgba(52,211,153,.12), #111116)" : colors.surface,
        border: `2px solid ${active ? colors.green : colors.border}`,
        borderRadius: 18,
        padding: 28,
        minHeight: 360,
        boxShadow: active ? "0 0 60px rgba(52,211,153,.12)" : "none",
      }}
    >
      <div style={{ fontFamily: monoStack, fontSize: 20, letterSpacing: 3, textTransform: "uppercase", color: active ? colors.green : colors.muted, marginBottom: 22 }}>
        {label}
      </div>
      <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: monoStack, fontSize: 28, lineHeight: 1.55, color: colors.text }}>
        {children}
      </pre>
    </div>
  );
}

function HeroScene({ frame }) {
  const pop = spring({ frame, fps: 30, config: { damping: 18, stiffness: 120 } });
  return (
    <AbsoluteFill style={{ padding: 82, justifyContent: "center" }}>
      <div style={easeIn(frame, 0)}>
        <Brand />
      </div>
      <div
        style={{
          ...easeIn(frame, 8),
          marginTop: 68,
          fontFamily: fontStack,
          fontSize: 94,
          lineHeight: 1.02,
          fontWeight: 900,
          color: colors.text,
          letterSpacing: -3,
        }}
      >
        Your auto-captions look messy.
        <br />
        <span style={{ color: colors.green }}>Fix the SRT first.</span>
      </div>
      <div style={{ ...easeIn(frame, 24), marginTop: 48, color: colors.muted, fontFamily: fontStack, fontSize: 36, lineHeight: 1.35, maxWidth: 860 }}>
        Remove punctuation, clean line breaks, and prep captions before you burn them into Reels, Shorts, and TikToks.
      </div>
      <div
        style={{
          ...easeIn(frame, 42),
          marginTop: 70,
          transform: `scale(${0.94 + pop * 0.06})`,
          transformOrigin: "left center",
          display: "inline-flex",
          width: "fit-content",
          alignItems: "center",
          gap: 16,
          padding: "22px 30px",
          borderRadius: 14,
          color: "#000",
          background: colors.green,
          fontFamily: monoStack,
          fontWeight: 900,
          fontSize: 27,
        }}
      >
        Drop .srt -&gt; download clean file
      </div>
    </AbsoluteFill>
  );
}

function BeforeAfterScene({ frame }) {
  const slide = interpolate(frame, [0, 34], [60, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ padding: 72, justifyContent: "center" }}>
      <div style={{ fontFamily: monoStack, color: colors.green, fontSize: 24, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase" }}>Before / After</div>
      <div style={{ marginTop: 28, fontFamily: fontStack, fontWeight: 900, fontSize: 68, lineHeight: 1.05, color: colors.text }}>
        Transcript captions in.
        <br />
        Clean burn-in captions out.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, marginTop: 58, transform: `translateX(${slide}px)` }}>
        <CaptionCard label="Before">
          {"1\n00:00:00,000 --> 00:00:02,500\nHey, what's up? Welcome to another video.\n\n2\n00:00:02,500 --> 00:00:05,000\nToday we're gonna talk about how to fix\nmessy subtitle files, super fast."}
        </CaptionCard>
        <CaptionCard label="After" active>
          {"1\n00:00:00,000 --> 00:00:02,500\nHey what's up Welcome to another video\n\n2\n00:00:02,500 --> 00:00:05,000\nToday we're gonna talk about how to fix messy subtitle files super fast"}
        </CaptionCard>
      </div>
    </AbsoluteFill>
  );
}

function ProofScene({ frame }) {
  const checks = [
    "Files stay in your browser",
    "No AI rewriting",
    "Clean one file free",
    "Batch process with Pro",
  ];
  return (
    <AbsoluteFill style={{ padding: 82, justifyContent: "center" }}>
      <div style={easeIn(frame, 0)}>
        <Brand />
      </div>
      <div style={{ ...easeIn(frame, 10), marginTop: 72, fontFamily: fontStack, fontSize: 78, fontWeight: 900, lineHeight: 1.05, color: colors.text }}>
        Built for editors who just want
        <br />
        <span style={{ color: colors.green }}>the reel finished.</span>
      </div>
      <div style={{ marginTop: 62, display: "grid", gap: 18 }}>
        {checks.map((check, index) => (
          <div
            key={check}
            style={{
              ...easeIn(frame, 22 + index * 8),
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "24px 26px",
              border: `2px solid ${colors.border}`,
              borderRadius: 16,
              background: colors.surface,
              color: colors.text,
              fontFamily: fontStack,
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            <span style={{ width: 36, height: 36, borderRadius: 999, background: colors.green, color: "#000", display: "grid", placeItems: "center", fontSize: 24 }}>✓</span>
            {check}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function CtaScene({ frame, siteUrl, checkoutText }) {
  return (
    <AbsoluteFill style={{ padding: 82, justifyContent: "center", alignItems: "flex-start" }}>
      <div style={easeIn(frame, 0)}>
        <Brand />
      </div>
      <div style={{ ...easeIn(frame, 8), marginTop: 78, fontFamily: fontStack, fontSize: 92, fontWeight: 900, lineHeight: 1.02, color: colors.text }}>
        Clean the captions
        <br />
        before the edit goes live.
      </div>
      <div style={{ ...easeIn(frame, 24), marginTop: 54, fontFamily: fontStack, color: colors.muted, fontSize: 38, lineHeight: 1.35 }}>
        {checkoutText}
      </div>
      <div style={{ ...easeIn(frame, 38), marginTop: 74, padding: "28px 34px", background: colors.green, color: "#000", borderRadius: 16, fontFamily: monoStack, fontWeight: 900, fontSize: 36 }}>
        {siteUrl}
      </div>
    </AbsoluteFill>
  );
}

export function SrtFixerVerticalAd({ siteUrl, checkoutText }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fadeOut = interpolate(frame, [durationInFrames - 22, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: colors.bg, opacity: fadeOut, overflow: "hidden" }}>
      <Grain />
      <Sequence from={0} durationInFrames={180}>
        <HeroScene frame={frame} />
      </Sequence>
      <Sequence from={180} durationInFrames={270}>
        <BeforeAfterScene frame={frame - 180} />
      </Sequence>
      <Sequence from={450} durationInFrames={210}>
        <ProofScene frame={frame - 450} />
      </Sequence>
      <Sequence from={660} durationInFrames={150}>
        <CtaScene frame={frame - 660} siteUrl={siteUrl} checkoutText={checkoutText} />
      </Sequence>
    </AbsoluteFill>
  );
}
