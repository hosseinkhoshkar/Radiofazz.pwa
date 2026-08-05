"use client";

import HomeHero from "../HomeHero";
import HomeQuickLinks from "../HomeQuickLinks";
import { usePlayer } from "../../context/PlayerContext";

export default function HomeView() {
  const { isAd } = usePlayer();

  return (
    <div className="flex min-h-full w-full flex-col gap-2 px-[clamp(0.75rem,3vw,2rem)] py-[clamp(0.4rem,1vh,1rem)] md:h-full md:overflow-hidden">
      <HomeHero />
      {/* Moved out of HomeHero's own card — used to render inside that same
          rounded-3xl box (below the badge/title/etc), sharing its height
          budget, which is exactly why the hero could balloon arbitrarily
          tall and push this section down past the mini-player. Now a real
          sibling below a hard-capped h-[70dvh] hero on mobile (desktop
          keeps its own flex-1 sizing, unaffected either way). */}
      {!isAd && <HomeQuickLinks />}
    </div>
  );
}
