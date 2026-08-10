"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { usePlayer } from "../context/PlayerContext";
import { useIsMobileViewport } from "@/lib/useIsMobileViewport";

// Same organic-pulse approach as the earlier disc-glow halo: offset sine
// waves per bar (own random phase/frequency), not real Web Audio frequency
// data — the remote stream's CORS restrictions make an AnalyserNode
// unreliable here, and the goal is just to visibly read as "music is
// playing," not real analysis.
const BAR_COUNT_DESKTOP = 80;
const BAR_COUNT_MOBILE = 46;

// Paused/settled flat height (layout %, not a transform — see below).
const MIN_SCALE = 0.12;
// Floor while actively playing — short "dot-like" bars still read as alive,
// distinct from the fully-settled paused state.
const DOT_SCALE = 0.22;
const MAX_SCALE = 1;
const ENVELOPE_EASE_SPEED = 3.5;

interface BarWave {
  freqA: number;
  freqB: number;
  phaseA: number;
  phaseB: number;
  // Biases the sine mix toward its low end so most frames land short and
  // "dot-like," with only occasional tall spikes — an irregular,
  // heartbeat-like rhythm instead of a smooth ripple. Varies per bar so
  // neighbors don't spike in lockstep.
  exponent: number;
}

function createBarWave(): BarWave {
  return {
    freqA: 0.25 + Math.random() * 0.85,
    freqB: 0.15 + Math.random() * 0.65,
    phaseA: Math.random() * Math.PI * 2,
    phaseB: Math.random() * Math.PI * 2,
    exponent: 1.8 + Math.random() * 2.6,
  };
}

interface HomeWaveformProps {
  // Lets compact contexts (e.g. the mini-player) render a smaller, less
  // dense version of the same visualizer instead of the full hero size.
  heightClassName?: string;
  barCountDesktop?: number;
  barCountMobile?: number;
}

export default function HomeWaveform({
  heightClassName = "h-[clamp(1.75rem,6vh,3.25rem)]",
  barCountDesktop = BAR_COUNT_DESKTOP,
  barCountMobile = BAR_COUNT_MOBILE,
}: HomeWaveformProps = {}) {
  const { isPlaying, isOffline } = usePlayer();
  const isMobile = useIsMobileViewport();
  const prefersReducedMotion = useReducedMotion();
  const barCount = isMobile ? barCountMobile : barCountDesktop;

  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const wavesRef = useRef<BarWave[]>([]);
  const envelopeRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);

  if (wavesRef.current.length !== barCount) {
    wavesRef.current = Array.from({ length: barCount }, createBarWave);
    barsRef.current = new Array(barCount).fill(null);
  }

  useEffect(() => {
    // Offline: same frozen, minimal, non-animating state as reduced-motion
    // — there's no live audio to visualize, so no envelope easing either,
    // straight to the static floor.
    if (prefersReducedMotion || isOffline) {
      envelopeRef.current = 0;
      lastTimeRef.current = null;
      barsRef.current.forEach((el) => {
        if (el) el.style.height = `${MIN_SCALE * 100}%`;
      });
      return;
    }

    let rafId: number;

    function tick(now: number) {
      const dt = Math.min((now - (lastTimeRef.current ?? now)) / 1000, 0.05);
      lastTimeRef.current = now;

      const target = isPlaying ? 1 : 0;
      envelopeRef.current += (target - envelopeRef.current) * Math.min(dt * ENVELOPE_EASE_SPEED, 1);

      const t = now / 1000;
      const waves = wavesRef.current;
      barsRef.current.forEach((el, i) => {
        if (!el) return;
        const wave = waves[i];
        const mix =
          Math.sin(2 * Math.PI * wave.freqA * t + wave.phaseA) * 0.6 +
          Math.sin(2 * Math.PI * wave.freqB * t + wave.phaseB) * 0.4;
        const normalized = (mix + 1) / 2;
        const shaped = normalized ** wave.exponent;
        const playingScale = DOT_SCALE + shaped * (MAX_SCALE - DOT_SCALE);
        const scale = MIN_SCALE + envelopeRef.current * (playingScale - MIN_SCALE);
        el.style.height = `${scale * 100}%`;
      });

      // Once paused, keep easing out until the bars actually settle flat,
      // then stop scheduling frames entirely instead of idling forever.
      if (isPlaying || envelopeRef.current > 0.002) {
        rafId = requestAnimationFrame(tick);
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, isOffline, prefersReducedMotion, barCount]);

  return (
    <div
      className={`flex w-full items-end gap-[0.5px] ${heightClassName}`}
      aria-hidden="true"
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            barsRef.current[i] = el;
          }}
          className="flex-1 rounded-full bg-gradient-to-t from-[rgb(var(--accent-from-rgb))] to-[rgb(var(--accent-to-rgb))]"
          style={{ height: `${MIN_SCALE * 100}%` }}
        />
      ))}
    </div>
  );
}
