const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";

export const DEFAULT_COVER_ART = "/cover-placeholder.svg";

// Matches the returned artwork's size suffix regardless of which size iTunes
// actually sent back (100x100bb, 60x60bb, etc.) — a literal "100x100bb"
// string match silently no-ops if the API ever responds with a different
// default size, leaving a low-res image in place with no error.
const ARTWORK_SIZE_SUFFIX = /\d+x\d+bb/;
const ARTWORK_SIZE = "600x600bb";

const SEARCH_TIMEOUT_MS = 4000;

// Repeated lookups for the same track (every ~15s poll, every listener)
// must not re-hit iTunes each time. Hits are cached longer than misses so a
// track that genuinely isn't in iTunes' catalog gets retried occasionally
// (e.g. it could get indexed later) without hammering the API every poll.
const HIT_TTL_MS = 24 * 60 * 60 * 1000;
const MISS_TTL_MS = 15 * 60 * 1000;

const cache = new Map<string, { url: string; expiresAt: number }>();

// Strips remix/version tags and noisy punctuation that make an otherwise
// findable track fail an exact-match-style iTunes search, e.g.
// "Hipnotizm (Original Mix)" -> "Hipnotizm", "Track - Radio Edit" -> "Track".
const NOISE_TAGS =
  /\s*[\(\[][^)\]]*\b(remix|mix|edit|version|remaster(ed)?|feat\.?|ft\.?|extended|radio|club|live|bonus|instrumental|acoustic|deluxe)\b[^)\]]*[\)\]]\s*/gi;
const TRAILING_NOISE = /\s*[-–—]\s*(remix|mix|edit|version|remaster(ed)?|extended|radio|club|live|instrumental|acoustic)\b.*$/i;

function cleanQuery(value: string): string {
  return value
    .replace(NOISE_TAGS, " ")
    .replace(TRAILING_NOISE, "")
    .replace(/[_*~`]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface ItunesTrack {
  artworkUrl100?: string;
}

interface ItunesSearchResponse {
  results?: ItunesTrack[];
}

async function searchArtwork(term: string): Promise<string | null> {
  if (!term) return null;

  const params = new URLSearchParams({
    term,
    media: "music",
    entity: "song",
    limit: "1",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${ITUNES_SEARCH_URL}?${params.toString()}`, {
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`[itunes] search failed for "${term}": HTTP ${res.status}`);
      return null;
    }

    const data: ItunesSearchResponse = await res.json();
    const artwork = data.results?.[0]?.artworkUrl100;
    if (!artwork) return null;

    return artwork.replace(ARTWORK_SIZE_SUFFIX, ARTWORK_SIZE);
  } catch (err) {
    const reason = controller.signal.aborted ? "timed out" : err;
    console.error(`[itunes] search request failed for "${term}":`, reason);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getCoverArt(
  artist: string | null,
  track: string | null
): Promise<string> {
  const cleanArtist = artist ? cleanQuery(artist) : "";
  const cleanTrack = track ? cleanQuery(track) : "";

  const cacheKey = `${cleanArtist.toLowerCase()}::${cleanTrack.toLowerCase()}`;
  if (!cleanArtist && !cleanTrack) {
    return DEFAULT_COVER_ART;
  }

  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  // Combined artist+track is the most specific match; if the exact
  // combination isn't found, fall back to track-only, then artist-only,
  // before giving up — some tracks just aren't in iTunes' catalog.
  const attempts = [
    [cleanArtist, cleanTrack].filter(Boolean).join(" "),
    cleanTrack,
    cleanArtist,
  ].filter((term, i, arr) => term && arr.indexOf(term) === i);

  let result: string | null = null;
  for (const term of attempts) {
    result = await searchArtwork(term);
    if (result) break;
  }

  const url = result ?? DEFAULT_COVER_ART;
  cache.set(cacheKey, {
    url,
    expiresAt: Date.now() + (result ? HIT_TTL_MS : MISS_TTL_MS),
  });

  return url;
}
