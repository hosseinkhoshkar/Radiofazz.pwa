"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useRef, type PointerEvent } from "react";
import { usePlayer } from "../context/PlayerContext";
import { useLanguage } from "../context/LanguageContext";
import { useFinePointer } from "@/lib/useFinePointer";

export default function Player() {
  const {
    isPlaying,
    isLoading,
    artist,
    track,
    coverArt,
    isMuted,
    toggleMute,
    togglePlay,
    analyserNode,
    isAd,
    adAdvertiser,
    adLink,
  } = usePlayer();
  const { t } = useLanguage();
  const trackKey = `${artist}::${track}`;

  const isFinePointer = useFinePointer();
  const prefersReducedMotion = useReducedMotion();
  const tiltEnabled = isFinePointer && !prefersReducedMotion;

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 150, damping: 15 });
  const springRotateY = useSpring(rotateY, { stiffness: 150, damping: 15 });

  function handleDiscPointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width - 0.5;
    const relY = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(relX * 14);
    rotateX.set(relY * -14);
  }

  function handleDiscPointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  const fadeDuration = prefersReducedMotion ? 0 : 0.4;

  return (
    <div className="flex w-full max-w-2xl shrink flex-col items-center gap-[clamp(0.375rem,1.2vh,1.25rem)]">
      <div
        className="relative flex h-[clamp(9rem,min(64vh,80vw),32rem)] w-[clamp(9rem,min(64vh,80vw),32rem)] items-center justify-center [perspective:800px]"
        onPointerMove={tiltEnabled ? handleDiscPointerMove : undefined}
        onPointerLeave={tiltEnabled ? handleDiscPointerLeave : undefined}
      >
        <AnimatePresence>
          {isPlaying && (
            <>
              <motion.span
                key="glow-from"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={
                  prefersReducedMotion
                    ? { opacity: 0.3, scale: 1 }
                    : { opacity: [0.4, 0.18, 0.4], scale: [0.9, 1.12, 0.9] }
                }
                exit={{ opacity: 0, scale: 0.9 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }
                className="absolute inset-0 rounded-full blur-3xl"
                style={{ backgroundColor: "rgb(var(--accent-from-rgb) / 45%)" }}
              />
              <motion.span
                key="glow-to"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={
                  prefersReducedMotion
                    ? { opacity: 0.25, scale: 1 }
                    : { opacity: [0.35, 0.12, 0.35], scale: [0.95, 1.15, 0.95] }
                }
                exit={{ opacity: 0, scale: 0.95 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : {
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5,
                      }
                }
                className="absolute inset-0 rounded-full blur-3xl"
                style={{ backgroundColor: "rgb(var(--accent-to-rgb) / 40%)" }}
              />
            </>
          )}
        </AnimatePresence>

        <RadialVisualizer
          isPlaying={isPlaying}
          analyserNode={analyserNode}
          prefersReducedMotion={prefersReducedMotion}
        />

        <motion.div
          style={
            tiltEnabled
              ? {
                  rotateX: springRotateX,
                  rotateY: springRotateY,
                  transformStyle: "preserve-3d",
                }
              : undefined
          }
          className="relative h-[calc(clamp(9rem,min(64vh,80vw),32rem)-1rem)] w-[calc(clamp(9rem,min(64vh,80vw),32rem)-1rem)] overflow-hidden rounded-full border border-foreground/10 bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 p-1"
        >
          <div className="relative h-full w-full overflow-hidden rounded-full bg-background-elevated">
            <AnimatePresence mode="wait">
              <motion.img
                key={coverArt}
                src={coverArt}
                alt={`${artist} - ${track}`}
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.92 }}
                transition={{ duration: fadeDuration }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <div className="min-h-[clamp(2rem,4vh,3.25rem)] w-full text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={trackKey}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
          >
            {isAd ? (
              <>
                <p className="text-shine truncate text-[clamp(1.125rem,2.5vw,1.75rem)] font-semibold">
                  {adAdvertiser}
                </p>
                {adLink && (
                  <a
                    href={adLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-gradient-to-l from-neon-pink to-neon-purple px-4 py-1.5 text-xs font-semibold text-background"
                  >
                    {t("player.visitSponsor")}
                  </a>
                )}
              </>
            ) : (
              <>
                <p className="text-shine truncate text-[clamp(1.125rem,2.5vw,1.75rem)] font-semibold">
                  {track}
                </p>
                <p className="mt-1 text-[clamp(0.75rem,1.3vw,0.9rem)] text-muted">{artist}</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <motion.button
          type="button"
          onClick={togglePlay}
          whileTap={{ scale: 0.92 }}
          aria-label={isPlaying ? t("player.pause") : t("player.play")}
          className="relative flex h-[clamp(2.75rem,6vh,4.25rem)] w-[clamp(2.75rem,6vh,4.25rem)] shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-foreground backdrop-blur-xl shadow-[0_8px_28px_-6px_rgba(59,130,246,0.5),inset_0_1px_0_0_rgba(255,255,255,0.35),inset_0_-6px_10px_-8px_rgba(0,0,0,0.3)]"
        >
          <span
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgb(var(--accent-from-rgb) / 30%), transparent 55%, rgb(var(--accent-to-rgb) / 30%))",
            }}
          />
          <AnimatePresence mode="wait" initial={false}>
            {isLoading ? (
              <motion.span
                key="loading"
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.7 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                className="relative h-6 w-6 animate-spin rounded-full border-2 border-foreground/70 border-t-transparent"
              />
            ) : isPlaying ? (
              <motion.span
                key="pause"
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.7, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.7, rotate: 20 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                className="relative flex"
              >
                <PauseIcon />
              </motion.span>
            ) : (
              <motion.span
                key="play"
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.7, rotate: 20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.7, rotate: -20 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                className="relative flex"
              >
                <PlayIcon />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? t("player.unmute") : t("player.mute")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted backdrop-blur-md transition-colors hover:text-neon-cyan"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isMuted ? "muted" : "unmuted"}
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.7 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
              className="relative flex"
            >
              {isMuted ? (
                <MutedIcon className="h-4 w-4" />
              ) : (
                <VolumeIcon className="h-4 w-4" />
              )}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      <p className="text-xs text-muted">
        {isPlaying
          ? t("player.statusPlaying")
          : isLoading
            ? t("player.statusLoading")
            : t("player.statusIdle")}
      </p>
    </div>
  );
}

// Bar count must match AnalyserNode.fftSize / 2 (frequencyBinCount) set in
// PlayerContext, so each bar maps 1:1 to a frequency bin with no resampling.
const VISUALIZER_BAR_COUNT = 32;
const VISUALIZER_MIN_SCALE = 0.15;

function RadialVisualizer({
  isPlaying,
  analyserNode,
  prefersReducedMotion,
}: {
  isPlaying: boolean;
  analyserNode: AnalyserNode | null;
  prefersReducedMotion: boolean | null;
}) {
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (prefersReducedMotion || !analyserNode || !isPlaying) {
      barRefs.current.forEach((el) => {
        if (el) el.style.transform = `scaleY(${VISUALIZER_MIN_SCALE})`;
      });
      return;
    }

    const data = new Uint8Array(analyserNode.frequencyBinCount);
    let rafId: number;

    function tick() {
      analyserNode!.getByteFrequencyData(data);
      barRefs.current.forEach((el, i) => {
        if (!el) return;
        const value = data[i] / 255;
        el.style.transform = `scaleY(${VISUALIZER_MIN_SCALE + value * (1 - VISUALIZER_MIN_SCALE)})`;
      });
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, analyserNode, prefersReducedMotion]);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: VISUALIZER_BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{ transform: `rotate(${(360 / VISUALIZER_BAR_COUNT) * i}deg)` }}
        >
          <span
            ref={(el) => {
              barRefs.current[i] = el;
            }}
            className="absolute left-1/2 top-[-2%] h-[14%] w-[2px] -translate-x-1/2 origin-bottom rounded-full"
            style={{
              transform: `scaleY(${VISUALIZER_MIN_SCALE})`,
              backgroundColor: "rgb(var(--accent-from-rgb) / 55%)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

function VolumeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 6a9 9 0 0 1 0 12" />
    </svg>
  );
}

function MutedIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="m17 9 5 6M22 9l-5 6" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="h-6 w-6 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
