"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePlayer } from "../context/PlayerContext";

export default function Player() {
  const {
    isPlaying,
    isLoading,
    artist,
    track,
    coverArt,
    volume,
    setVolume,
    togglePlay,
  } = usePlayer();
  const trackKey = `${artist}::${track}`;

  return (
    <div className="flex w-full max-w-sm shrink flex-col items-center gap-[clamp(0.75rem,2vh,1.5rem)] rounded-3xl border border-foreground/10 bg-background-elevated/60 p-[clamp(1.25rem,3.5vh,2rem)] shadow-[0_0_60px_-15px_rgba(59,130,246,0.35)] backdrop-blur-xl">
      <div className="relative flex h-[clamp(6rem,22vh,11rem)] w-[clamp(6rem,22vh,11rem)] items-center justify-center">
        <AnimatePresence>
          {isPlaying && (
            <>
              <motion.span
                key="glow-blue"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0.35, 0.15, 0.35], scale: [0.9, 1.12, 0.9] }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-neon-cyan to-neon-blue blur-2xl"
              />
              <motion.span
                key="glow-purple"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: [0.3, 0.1, 0.3], scale: [0.95, 1.15, 0.95] }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-neon-purple to-neon-violet blur-2xl"
              />
            </>
          )}
        </AnimatePresence>

        <div className="relative h-[clamp(5.5rem,20vh,10rem)] w-[clamp(5.5rem,20vh,10rem)] overflow-hidden rounded-full border border-foreground/10 bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 p-1">
          <div className="relative h-full w-full overflow-hidden rounded-full bg-background-elevated">
            <AnimatePresence mode="wait">
              <motion.img
                key={coverArt}
                src={coverArt}
                alt={`${artist} - ${track}`}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="h-[clamp(3rem,6vh,3.5rem)] w-full text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={trackKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-shine truncate text-lg font-semibold">
              {track}
            </p>
            <p className="mt-1 text-xs text-muted">{artist}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.button
        type="button"
        onClick={togglePlay}
        whileTap={{ scale: 0.9 }}
        aria-label={isPlaying ? "توقف پخش" : "شروع پخش"}
        className="flex h-[clamp(3rem,8vh,4rem)] w-[clamp(3rem,8vh,4rem)] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon-blue to-neon-purple text-background shadow-[0_0_25px_-5px_rgba(59,130,246,0.7)]"
      >
        {isLoading ? (
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-background border-t-transparent" />
        ) : isPlaying ? (
          <PauseIcon />
        ) : (
          <PlayIcon />
        )}
      </motion.button>

      <p className="text-xs text-muted">
        {isPlaying
          ? "در حال پخش زنده"
          : isLoading
            ? "در حال اتصال..."
            : "برای شروع پخش لمس کنید"}
      </p>

      <div className="flex w-full items-center gap-3 px-1">
        <VolumeIcon className="h-4 w-4 shrink-0 text-muted" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-label="میزان صدا"
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-foreground/10 accent-neon-cyan"
        />
        <Waveform isPlaying={isPlaying} />
      </div>
    </div>
  );
}

function Waveform({ isPlaying }: { isPlaying: boolean }) {
  const delays = [0, 0.12, 0.24, 0.36, 0.48];

  return (
    <div className="flex h-4 shrink-0 items-end gap-0.5" aria-hidden="true">
      {delays.map((delay, index) => (
        <span
          key={index}
          data-playing={isPlaying}
          className="waveform-bar h-full w-0.5 rounded-full bg-neon-cyan"
          style={{ animationDelay: `${delay}s` }}
        />
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
