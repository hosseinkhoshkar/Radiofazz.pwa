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
import { DEFAULT_COVER_ART } from "@/lib/itunes";
import { ACCENT_PALETTES, hexToRgb, pickPalette, type AccentPalette, type RGB } from "@/lib/accentPalettes";
import { useLanguage } from "./LanguageContext";

const STREAM_URL = "/api/stream";
const NOWPLAYING_URL = "/api/nowplaying";
const ADS_URL = "/data/ads.json";
const POLL_INTERVAL_MS = 15000;
// Defense in depth on top of the API route's own 5s Icecast timeout — a
// hung/broken fetch to our own route (bad network, cold serverless start)
// must not block a poll cycle indefinitely either.
const NOWPLAYING_TIMEOUT_MS = 8000;
// Grace period after a "stalled" audio event before treating it as a real
// interruption rather than a normal, brief buffering blip.
const STALL_GRACE_MS = 4000;

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
  coverArt: string;
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
  adSlug: string | null;
  adAdvertiser: string | null;
  adLink: string | null;
  adImage: string | null;
  listeners: number;
  isOffline: boolean;
  streamInterrupted: boolean;
  retryPlayback: () => void;
  dismissStreamInterrupted: () => void;
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
  const [isOffline, setIsOffline] = useState(false);
  const [streamInterrupted, setStreamInterrupted] = useState(false);

  // Tracks whether the user currently *wants* playback (vs. having
  // deliberately paused) so an error/stalled audio event can tell "the
  // connection dropped mid-playback" apart from "the user hit pause" —
  // both fire similar events on the <audio> element otherwise.
  const playIntentRef = useRef(false);
  const statusRef = useRef<PlayerStatus>("idle");
  const stalledTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const themeFromRef = useRef<ThemeColors>(DEFAULT_THEME);
  const themeTargetRef = useRef<ThemeColors>(DEFAULT_THEME);
  const themeCurrentRef = useRef<ThemeColors>(DEFAULT_THEME);
  const themeStartRef = useRef(0);
  const themeRafRef = useRef<number | null>(null);

  const isPlaying = status === "playing";
  const isLoading = status === "loading";

  // An "AD:"-prefixed title means sponsor mode even if the slug isn't in
  // ads.json yet — falls back to a generic sponsored state below instead of
  // silently reverting to normal-track display. Forced off while offline —
  // a stale ad-flagged title from before the stream dropped must never
  // display as sponsored content once the stream itself is confirmed down.
  const adSlug = testAdSlug ?? parseAdSlug(nowPlaying?.track ?? null);
  const isAd = !isOffline && adSlug != null;
  const activeAd = isAd && adSlug ? (ads[adSlug] ?? null) : null;
  const adAdvertiser = isAd ? (activeAd?.advertiser ?? t("player.sponsorLabel")) : null;
  const adLink = activeAd?.link ?? null;
  const adImage = activeAd?.image ?? null;

  const paletteKey = `${nowPlaying?.artist ?? ""}::${nowPlaying?.track ?? ""}`;
  const palette = isAd ? SPONSOR_PALETTE : pickPalette(paletteKey);

  // Offline takes priority over everything else — a static "Radio Faaz" +
  // tagline pair instead of stale/last-known track info.
  const artist = isOffline
    ? t("home.tagline")
    : isAd
      ? t("player.sponsorLabel")
      : (nowPlaying?.artist ?? t("brand.name"));
  const track = isOffline
    ? t("brand.name")
    : isAd
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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), NOWPLAYING_TIMEOUT_MS);

      try {
        const res = await fetch(NOWPLAYING_URL, { signal: controller.signal });
        if (cancelled) return;

        if (!res.ok) {
          setIsOffline(true);
          return;
        }

        const data: { isOffline?: boolean; sources: NowPlayingSource[] } = await res.json();
        if (cancelled) return;

        if (data.isOffline) {
          setIsOffline(true);
          return;
        }

        const primary = data.sources?.[0] ?? null;
        if (primary) {
          setNowPlaying(primary);
          setIsOffline(false);
        } else {
          // Reachable, but reporting no live mount — same "nothing to
          // play" state as unreachable, from the listener's perspective.
          setIsOffline(true);
        }
      } catch {
        // Network error, or the abort from the timeout above — the site
        // must recover automatically on the next poll once reachable
        // again, so this never throws further or stops the interval.
        if (!cancelled) setIsOffline(true);
      } finally {
        clearTimeout(timeout);
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
    if (isOffline) {
      setCoverArt(DEFAULT_COVER_ART);
      return;
    }

    if (isAd) {
      if (activeAd) setCoverArt(activeAd.image);
      return;
    }

    setCoverArt(nowPlaying?.coverArt || DEFAULT_COVER_ART);
  }, [isOffline, isAd, activeAd, nowPlaying?.coverArt]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    return () => {
      if (stalledTimerRef.current != null) clearTimeout(stalledTimerRef.current);
    };
  }, []);

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
    // No point attempting playback against a stream we already know is
    // down — the Play button is disabled in the UI for this same reason,
    // but guard here too against any other caller.
    if (!audio || isOffline) return;

    if (isPlaying || isLoading) {
      playIntentRef.current = false;
      audio.pause();
      setStatus("paused");
      return;
    }

    playIntentRef.current = true;
    setStreamInterrupted(false);
    setStatus("loading");
    audio.play().catch(() => setStatus("paused"));
  };

  // Forces a fresh connection (not just resuming a dead one) — .load()
  // resets the element before .play() reconnects to the stream URL.
  const retryPlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setStreamInterrupted(false);
    playIntentRef.current = true;
    setStatus("loading");
    audio.load();
    audio.play().catch(() => setStatus("paused"));
  };

  const dismissStreamInterrupted = () => setStreamInterrupted(false);

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
        adSlug: isAd ? adSlug : null,
        adAdvertiser,
        adLink,
        adImage,
        listeners: nowPlaying?.listeners ?? 0,
        isOffline,
        streamInterrupted,
        retryPlayback,
        dismissStreamInterrupted,
      }}
    >
      <audio
        ref={audioRef}
        src={STREAM_URL}
        preload="none"
        onPlaying={() => {
          setStatus("playing");
          setStreamInterrupted(false);
          if (stalledTimerRef.current != null) {
            clearTimeout(stalledTimerRef.current);
            stalledTimerRef.current = null;
          }
        }}
        onWaiting={() => setStatus("loading")}
        onPause={() => setStatus("paused")}
        onError={() => {
          setStatus("paused");
          // Only a real mid-playback drop if the user actually wanted
          // playback running — a deliberate pause() doesn't set this.
          if (playIntentRef.current) setStreamInterrupted(true);
          playIntentRef.current = false;
        }}
        onStalled={() => {
          // "stalled" fires for normal brief buffering too — wait out a
          // grace period and only flag it as a real interruption if
          // playback still hasn't recovered by then.
          if (!playIntentRef.current || stalledTimerRef.current != null) return;
          stalledTimerRef.current = setTimeout(() => {
            stalledTimerRef.current = null;
            if (playIntentRef.current && statusRef.current !== "playing") {
              setStreamInterrupted(true);
            }
          }, STALL_GRACE_MS);
        }}
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
