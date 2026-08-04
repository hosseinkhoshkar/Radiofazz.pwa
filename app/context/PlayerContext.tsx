"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "framer-motion";
import { DEFAULT_COVER_ART, getCoverArt } from "@/lib/itunes";
import { ACCENT_PALETTES, hexToRgb, pickPalette, type RGB } from "@/lib/accentPalettes";
import { useLanguage } from "./LanguageContext";

const STREAM_URL = "http://www.radiofaaz.com:8000/radiofaaz";
const NOWPLAYING_URL = "/api/nowplaying";
const ADS_URL = "/data/ads.json";
const POLL_INTERVAL_MS = 15000;

// Icecast now-playing titles announce sponsored content with this prefix,
// e.g. "AD: sponsor-one" — the remainder is the slug looked up in ads.json.
const AD_TITLE_PREFIX = /^ad:\s*/i;

const PALETTE_TRANSITION_MS = 1000;

interface AccentPair {
  from: RGB;
  to: RGB;
}

interface AdEntry {
  image: string;
  advertiser: string;
  link?: string;
}

type AdsMap = Record<string, AdEntry>;

function parseAdSlug(title: string | null): string | null {
  if (!title) return null;
  const match = title.match(AD_TITLE_PREFIX);
  if (!match) return null;
  return title.slice(match[0].length).trim() || null;
}

// Kept small on purpose: this only feeds a decorative visualizer, not audio
// processing, so a coarse 32-bin resolution is plenty and cheap to poll.
const ANALYSER_FFT_SIZE = 64;

function lerpRgb(from: RGB, to: RGB, progress: number): RGB {
  return [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress,
    from[2] + (to[2] - from[2]) * progress,
  ];
}

function applyAccentColors({ from, to }: AccentPair) {
  const root = document.documentElement.style;
  root.setProperty(
    "--accent-from-rgb",
    `${Math.round(from[0])} ${Math.round(from[1])} ${Math.round(from[2])}`
  );
  root.setProperty(
    "--accent-to-rgb",
    `${Math.round(to[0])} ${Math.round(to[1])} ${Math.round(to[2])}`
  );
}

// Matches the --accent-from-rgb / --accent-to-rgb fallback in globals.css.
const DEFAULT_ACCENT: AccentPair = {
  from: hexToRgb(ACCENT_PALETTES[0].from),
  to: hexToRgb(ACCENT_PALETTES[0].to),
};

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
  isMuted: boolean;
  toggleMute: () => void;
  togglePlay: () => void;
  analyserNode: AnalyserNode | null;
  isAd: boolean;
  adAdvertiser: string | null;
  adLink: string | null;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [nowPlaying, setNowPlaying] = useState<NowPlayingSource | null>(null);
  const [coverArt, setCoverArt] = useState(DEFAULT_COVER_ART);
  const [isMuted, setIsMuted] = useState(false);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [ads, setAds] = useState<AdsMap>({});
  const [testAdSlug, setTestAdSlug] = useState<string | null>(null);

  const accentFromRef = useRef<AccentPair>(DEFAULT_ACCENT);
  const accentTargetRef = useRef<AccentPair>(DEFAULT_ACCENT);
  const accentCurrentRef = useRef<AccentPair>(DEFAULT_ACCENT);
  const accentStartRef = useRef(0);
  const accentRafRef = useRef<number | null>(null);

  const isPlaying = status === "playing";
  const isLoading = status === "loading";

  const adSlug = testAdSlug ?? parseAdSlug(nowPlaying?.track ?? null);
  const activeAd = adSlug ? (ads[adSlug] ?? null) : null;
  const isAd = activeAd != null;
  const adAdvertiser = activeAd?.advertiser ?? null;
  const adLink = activeAd?.link ?? null;

  const paletteKey = isAd
    ? (adSlug ?? "")
    : `${nowPlaying?.artist ?? ""}::${nowPlaying?.track ?? ""}`;
  const palette = pickPalette(paletteKey);

  const artist = isAd
    ? t("player.sponsorLabel")
    : (nowPlaying?.artist ?? t("brand.name"));
  const track = isAd
    ? (adAdvertiser ?? t("player.sponsorLabel"))
    : (nowPlaying?.track ?? t("player.statusPlaying"));

  useEffect(() => {
    let cancelled = false;

    fetch(ADS_URL)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: AdsMap) => {
        if (!cancelled) setAds(data);
      })
      .catch(() => {
        if (!cancelled) setAds({});
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const slug = new URLSearchParams(window.location.search).get("test-ad");
    if (slug) setTestAdSlug(slug);
  }, []);

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
    if (isAd) {
      if (activeAd) setCoverArt(activeAd.image);
      return;
    }

    let cancelled = false;

    getCoverArt(nowPlaying?.artist ?? null, nowPlaying?.track ?? null).then(
      (url) => {
        if (!cancelled) setCoverArt(url);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [isAd, activeAd, nowPlaying?.artist, nowPlaying?.track]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    const target: AccentPair = {
      from: hexToRgb(palette.from),
      to: hexToRgb(palette.to),
    };

    if (prefersReducedMotion) {
      accentFromRef.current = target;
      accentTargetRef.current = target;
      accentCurrentRef.current = target;
      applyAccentColors(target);
      return;
    }

    accentFromRef.current = accentCurrentRef.current;
    accentTargetRef.current = target;
    accentStartRef.current = performance.now();

    if (accentRafRef.current != null) return;

    function tick(now: number) {
      const elapsed = now - accentStartRef.current;
      const progress = Math.min(elapsed / PALETTE_TRANSITION_MS, 1);
      const from = accentFromRef.current;
      const to = accentTargetRef.current;
      const next: AccentPair = {
        from: lerpRgb(from.from, to.from, progress),
        to: lerpRgb(from.to, to.to, progress),
      };
      accentCurrentRef.current = next;
      applyAccentColors(next);

      if (progress < 1) {
        accentRafRef.current = requestAnimationFrame(tick);
      } else {
        accentRafRef.current = null;
      }
    }

    accentRafRef.current = requestAnimationFrame(tick);
  }, [palette.name, palette.from, palette.to, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (accentRafRef.current != null) cancelAnimationFrame(accentRafRef.current);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying || isLoading) {
      audio.pause();
      setStatus("paused");
      return;
    }

    if (!prefersReducedMotion && !audioContextRef.current) {
      try {
        const ctx = new AudioContext();
        const source = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = ANALYSER_FFT_SIZE;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        audioContextRef.current = ctx;
        setAnalyserNode(analyser);
      } catch {
        // The radial visualizer is a decorative enhancement; playback works without it.
      }
    }

    audioContextRef.current?.resume();

    setStatus("loading");
    audio.play().catch(() => setStatus("paused"));
  };

  const toggleMute = () => setIsMuted((prev) => !prev);

  return (
    <PlayerContext.Provider
      value={{
        status,
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
