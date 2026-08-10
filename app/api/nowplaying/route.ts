import { getCoverArt } from "@/lib/itunes";

const STATUS_URL = "http://www.radiofaaz.com:8000/status-json.xsl";
const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };
// A hung Icecast origin must never block this route indefinitely — abort
// and fall back to the offline response instead.
const STATUS_TIMEOUT_MS = 5000;

interface IcecastSource {
  title?: string;
  listeners?: number;
  listenurl?: string;
  [key: string]: unknown;
}

function splitTitle(title?: string) {
  if (!title) {
    return { artist: null, track: null };
  }

  const separator = " - ";
  const index = title.indexOf(separator);
  if (index === -1) {
    return { artist: null, track: title };
  }

  return {
    artist: title.slice(0, index),
    track: title.slice(index + separator.length),
  };
}

// Icecast unreachable, slow, or erroring — the frontend polls this route
// continuously, so it must always get a fast, parseable response (200 +
// isOffline) rather than a 500/502 it has to special-case, and never hang.
function offlineResponse() {
  return Response.json({ isOffline: true, sources: [] }, { headers: CORS_HEADERS });
}

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STATUS_TIMEOUT_MS);

  try {
    const res = await fetch(STATUS_URL, { cache: "no-store", signal: controller.signal });

    if (!res.ok) {
      return offlineResponse();
    }

    const data = await res.json();
    const rawSource = data?.icestats?.source;
    const sources: IcecastSource[] = Array.isArray(rawSource)
      ? rawSource
      : rawSource
        ? [rawSource]
        : [];

    // Cover art lookups for each source run concurrently (not chained after
    // one another) — getCoverArt itself has its own timeout + cache so a
    // slow/unresponsive iTunes call can't stall this response either.
    const nowPlaying = await Promise.all(
      sources.map(async (source) => {
        const { artist, track } = splitTitle(source.title);
        const coverArt = await getCoverArt(artist, track);
        return {
          mount: source.listenurl ?? null,
          artist,
          track,
          listeners: source.listeners ?? 0,
          coverArt,
        };
      })
    );

    return Response.json({ isOffline: false, sources: nowPlaying }, { headers: CORS_HEADERS });
  } catch {
    // Network error, DNS failure, or the abort from the timeout above.
    return offlineResponse();
  } finally {
    clearTimeout(timeout);
  }
}
