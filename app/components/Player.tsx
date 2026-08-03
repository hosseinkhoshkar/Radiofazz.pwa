"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DEFAULT_COVER_ART, getCoverArt } from "@/lib/itunes";

const STREAM_URL = "http://www.radiofaaz.com:8000/radiofaaz";
const NOWPLAYING_URL = "/api/nowplaying";
const POLL_INTERVAL_MS = 15000;

type PlayerStatus = "idle" | "loading" | "playing" | "paused";

interface NowPlayingSource {
  artist: string | null;
  track: string | null;
  listeners: number;
}

export default function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [nowPlaying, setNowPlaying] = useState<NowPlayingSource | null>(null);
  const [coverArt, setCoverArt] = useState(DEFAULT_COVER_ART);

  const isPlaying = status === "playing";
  const isLoading = status === "loading";

  const artist = nowPlaying?.artist ?? "رادیو فاز";
  const track = nowPlaying?.track ?? "در حال پخش زنده";
  const trackKey = `${artist}::${track}`;

  useEffect(() => {
    let cancelled = false;

    async function fetchNowPlaying() {
      try {
        const res = await fetch(NOWPLAYING_URL);
        if (!res.ok) return;

        const data: { sources: NowPlayingSource[] } = await res.json();
        const primary = data.sources?.[0] ?? null;
        if (!cancelled && primary) {
          setNowPlaying(primary);
        }
      } catch {
        // stream metadata is best-effort; keep showing the last known track
      }
    }

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    getCoverArt(nowPlaying?.artist ?? null, nowPlaying?.track ?? null).then(
      (url) => {
        if (!cancelled) setCoverArt(url);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [nowPlaying?.artist, nowPlaying?.track]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying || isLoading) {
      audio.pause();
      setStatus("paused");
      return;
    }

    setStatus("loading");
    audio.play().catch(() => setStatus("paused"));
  };

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-neon-purple/20 bg-background-elevated p-8 shadow-[0_0_60px_-15px_rgba(168,85,247,0.35)]">
      <audio
        ref={audioRef}
        src={STREAM_URL}
        preload="none"
        onPlaying={() => setStatus("playing")}
        onWaiting={() => setStatus("loading")}
        onPause={() => setStatus("paused")}
        onError={() => setStatus("paused")}
      />

      <div className="relative h-40 w-40">
        <motion.div
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={
            isPlaying
              ? { duration: 12, repeat: Infinity, ease: "linear" }
              : { duration: 0.4 }
          }
          className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-neon-pink via-neon-purple to-neon-cyan p-1"
        >
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
        </motion.div>

        <AnimatePresence>
          {isPlaying && (
            <motion.span
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 1.35 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-neon-cyan"
            />
          )}
        </AnimatePresence>
      </div>

      <div className="h-12 w-full text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={trackKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-xs text-muted">{artist}</p>
            <p className="mt-1 truncate text-lg font-semibold text-foreground">
              {track}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.button
        type="button"
        onClick={togglePlay}
        whileTap={{ scale: 0.9 }}
        aria-label={isPlaying ? "توقف پخش" : "شروع پخش"}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-neon-pink to-neon-purple text-background shadow-[0_0_25px_-5px_rgba(255,46,136,0.7)]"
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
    </div>
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
