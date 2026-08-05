"use client";

import HomeHero from "../HomeHero";

export default function HomeView() {
  return (
    <div className="flex min-h-full w-full flex-col gap-2 px-[clamp(0.75rem,3vw,2rem)] py-[clamp(0.4rem,1vh,1rem)] md:h-full md:overflow-hidden">
      <HomeHero />
    </div>
  );
}
