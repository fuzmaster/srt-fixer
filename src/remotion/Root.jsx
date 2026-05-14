import React from "react";
import { Composition } from "remotion";
import { SrtFixerVerticalAd } from "./SrtFixerVerticalAd";

export function RemotionRoot() {
  return (
    <Composition
      id="SrtFixerVerticalAd"
      component={SrtFixerVerticalAd}
      durationInFrames={810}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        siteUrl: "srt-fixer-eight.vercel.app",
        checkoutText: "Free cleaner. Pro batch tools.",
      }}
    />
  );
}
