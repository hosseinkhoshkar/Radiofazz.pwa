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
import { ACCENT_PALETTES, hexToRgb, pickPalette, type AccentPalette, type RGB } from "@/lib/accentPalettes";
import { useLanguage } from "./LanguageContext";

const STREAM_URL = "/api/stream";
const NOWPLAYING_URL = "/api/nowplaying";
const ADS_URL = "/data/ads.json";
const POLL_INTERVAL_MS = 15000;

// Icecast now-playing titles announce sponsored content with this prefix,
// e.g. "AD: sponsor-one" — the remainder is the slug looked up in ads.json.
const AD_TITLE_PREFIX = /^ad:\s*/i;

const PALETTE_TRANSITION_MS = 1000;

interface ThemeColors {
  accentFrom: RGB;
  accentTo: RGB;
  accentText: RGB;
  bgFrom: RGB;
  bgTo: RGB;
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

function lerpRgb(from: RGB, to: RGB, progress: number): RGB {
  return [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress,
    from[2] + (to[2] - from[2]) * progress,
  ];
}

function rgbVar([r, g, b]: RGB): string {
  return `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`;
}

// Accent and background are written together every frame so they crossfade
// as one cohesive shift, never independently or out of sync.
function applyThemeColors(theme: ThemeColors) {
  const root = document.documentElement.style;
  root.setProperty("--accent-from-rgb", rgbVar(theme.accentFrom));
  root.setProperty("--accent-to-rgb", rgbVar(theme.accentTo));
  root.setProperty("--accent-text-rgb", rgbVar(theme.accentText));
  root.setProperty("--bg-from-rgb", rgbVar(theme.bgFrom));
  root.setProperty("--bg-to-rgb", rgbVar(theme.bgTo));
}

// Matches the --accent-*-rgb / --bg-*-rgb fallbacks in globals.css.
const DEFAULT_THEME: ThemeColors = {
  accentFrom: hexToRgb(ACCENT_PALETTES[0].from),
  accentTo: hexToRgb(ACCENT_PALETTES[0].to),
  accentText: hexToRgb(ACCENT_PALETTES[0].textFrom),
  bgFrom: hexToRgb(ACCENT_PALETTES[0].bgFrom),
  bgTo: hexToRgb(ACCENT_PALETTES[0].bgTo),
};

// Sponsor mode always uses this palette (not hashed per-slug, and not part
// of the rotating 10) so every ad reads as a consistent, recognizable
// "sponsored" moment regardless of what hues the rotation currently uses.
const SPONSOR_PALETTE: AccentPalette = {
  name: "sponsor-gold",
  from: "#fde68a",
  to: "#f59e0b",
  bgFrom: "#11100a",
  bgTo: "#06060c",
  textFrom: "#fde68a",
  onAccent: "#06060c",
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
  volume: number;
  setVolume: (volume: number) => void;
  togglePlay: () => void;
  isAd: boolean;
  adAdvertiser: string | null;
  adLink: string | null;
  adImage: string | null;
  listeners: number;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [nowPlaying, setNowPlaying] = useState<NowPlayingSource | null>(null);
  const [coverArt, setCoverArt] = useState(DEFAULT_COVER_ART);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [ads, setAds] = useState<AdsMap>({});
  const [testAdSlug, setTestAdSlug] = useState<string | null>(null);

  const themeFromRef = useRef<ThemeColors>(DEFAULT_THEME);
  const themeTargetRef = useRef<ThemeColors>(DEFAULT_THEME);
  const themeCurrentRef = useRef<ThemeColors>(DEFAULT_THEME);
  const themeStartRef = useRef(0);
  const themeRafRef = useRef<number | null>(null);

  const isPlaying = status === "playing";
  const isLoading = status === "loading";

  // An "AD:"-prefixed title means sponsor mode even if the slug isn't in
  // ads.json yet — falls back to a generic sponsored state below instead of
  // silently reverting to normal-track display.
  const adSlug = testAdSlug ?? parseAdSlug(nowPlaying?.track ?? null);
  const isAd = adSlug != null;
  const activeAd = adSlug ? (ads[adSlug] ?? null) : null;
  const adAdvertiser = isAd ? (activeAd?.advertiser ?? t("player.sponsorLabel")) : null;
  const adLink = activeAd?.link ?? null;
  const adImage = activeAd?.image ?? null;

  const paletteKey = `${nowPlaying?.artist ?? ""}::${nowPlaying?.track ?? ""}`;
  const palette = isAd ? SPONSOR_PALETTE : pickPalette(paletteKey);

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
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // onAccent is a fixed near-black/near-white choice, not a color to
  // crossfade between (lerping black->white draws a muddy gray mid-fade) —
  // snapped straight to the target palette's value, independent of the RAF
  // tween below.
  useEffect(() => {
    document.documentElement.style.setProperty("--accent-on-rgb", rgbVar(hexToRgb(palette.onAccent)));
  }, [palette.onAccent]);

  useEffect(() => {
    const target: ThemeColors = {
      accentFrom: hexToRgb(palette.from),
      accentTo: hexToRgb(palette.to),
      accentText: hexToRgb(palette.textFrom),
      bgFrom: hexToRgb(palette.bgFrom),
      bgTo: hexToRgb(palette.bgTo),
    };

    if (prefersReducedMotion) {
      themeFromRef.current = target;
      themeTargetRef.current = target;
      themeCurrentRef.current = target;
      applyThemeColors(target);
      return;
    }

    themeFromRef.current = themeCurrentRef.current;
    themeTargetRef.current = target;
    themeStartRef.current = performance.now();

    if (themeRafRef.current != null) return;

    function tick(now: number) {
      const elapsed = now - themeStartRef.current;
      const progress = Math.min(elapsed / PALETTE_TRANSITION_MS, 1);
      const from = themeFromRef.current;
      const to = themeTargetRef.current;
      const next: ThemeColors = {
        accentFrom: lerpRgb(from.accentFrom, to.accentFrom, progress),
        accentTo: lerpRgb(from.accentTo, to.accentTo, progress),
        accentText: lerpRgb(from.accentText, to.accentText, progress),
        bgFrom: lerpRgb(from.bgFrom, to.bgFrom, progress),
        bgTo: lerpRgb(from.bgTo, to.bgTo, progress),
      };
      themeCurrentRef.current = next;
      applyThemeColors(next);

      if (progress < 1) {
        themeRafRef.current = requestAnimationFrame(tick);
      } else {
        themeRafRef.current = null;
      }
    }

    themeRafRef.current = requestAnimationFrame(tick);
  }, [palette.name, palette.from, palette.to, palette.textFrom, palette.bgFrom, palette.bgTo, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (themeRafRef.current != null) cancelAnimationFrame(themeRafRef.current);
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

    setStatus("loading");
    audio.play().catch(() => setStatus("paused"));
  };

  const toggleMute = () => setIsMuted((prev) => !prev);

  const setVolume = (next: number) => {
    const clamped = Math.max(0, Math.min(1, next));
    setVolumeState(clamped);
    // Raising the volume while muted should audibly do something —
    // otherwise dragging the slider up looks broken.
    if (clamped > 0 && isMuted) setIsMuted(false);
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
        isMuted,
        toggleMute,
        volume,
        setVolume,
        togglePlay,
        isAd,
        adAdvertiser,
        adLink,
        adImage,
        listeners: nowPlaying?.listeners ?? 0,
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
