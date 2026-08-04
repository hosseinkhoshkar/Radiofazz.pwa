"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_COVER_ART, getCoverArt } from "@/lib/itunes";
import { useLanguage } from "./LanguageContext";

const STREAM_URL = "http://www.radiofaaz.com:8000/radiofaaz";
const NOWPLAYING_URL = "/api/nowplaying";
const POLL_INTERVAL_MS = 15000;

export type PlayerStatus = "idle" | "loading" | "playing" | "paused";

interface NowPlayingSource {
  artist: string | null;
  track: string | null;
  listeners: number;
}

interface PlayerContextValue {
  status: PlayerStatus;
  isPlaying: boolean;
  isLoading: boolean;
  artist: string;
  track: string;
  coverArt: string;
  volume: number;
  setVolume: (volume: number) => void;
  togglePlay: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [nowPlaying, setNowPlaying] = useState<NowPlayingSource | null>(null);
  const [coverArt, setCoverArt] = useState(DEFAULT_COVER_ART);
  const [volume, setVolume] = useState(1);

  const isPlaying = status === "playing";
  const isLoading = status === "loading";

  const artist = nowPlaying?.artist ?? t("brand.name");
  const track = nowPlaying?.track ?? t("player.statusPlaying");

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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

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
    <PlayerContext.Provider
      value={{
        status,
        isPlaying,
        isLoading,
        artist,
        track,
        coverArt,
        volume,
        setVolume,
        togglePlay,
      }}
    >
      <audio
        ref={audioRef}
        src={STREAM_URL}
        preload="none"
        onPlaying={() => setStatus("playing")}
        onWaiting={() => setStatus("loading")}
        onPause={() => setStatus("paused")}
        onError={() => setStatus("paused")}
      />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return ctx;
}
