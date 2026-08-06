const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";

export const DEFAULT_COVER_ART = "/cover-placeholder.svg";

// Matches the returned artwork's size suffix regardless of which size iTunes
// actually sent back (100x100bb, 60x60bb, etc.) — a literal "100x100bb"
// string match silently no-ops if the API ever responds with a different
// default size, leaving a low-res image in place with no error.
const ARTWORK_SIZE_SUFFIX = /\d+x\d+bb/;
const ARTWORK_SIZE = "600x600bb";

interface ItunesTrack {
  artworkUrl100?: string;
}

interface ItunesSearchResponse {
  results?: ItunesTrack[];
}

export async function getCoverArt(
  artist: string | null,
  track: string | null
): Promise<string> {
  const term = [artist, track]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
  if (!term) {
    return DEFAULT_COVER_ART;
  }

  const params = new URLSearchParams({
    term,
    media: "music",
    entity: "song",
    limit: "1",
  });

  try {
    const res = await fetch(`${ITUNES_SEARCH_URL}?${params.toString()}`);
    if (!res.ok) {
      console.error(`[itunes] search failed for "${term}": HTTP ${res.status}`);
      return DEFAULT_COVER_ART;
    }

    const data: ItunesSearchResponse = await res.json();
    const artwork = data.results?.[0]?.artworkUrl100;
    if (!artwork) {
      console.error(`[itunes] no artwork found for "${term}"`);
      return DEFAULT_COVER_ART;
    }

    return artwork.replace(ARTWORK_SIZE_SUFFIX, ARTWORK_SIZE);
  } catch (err) {
    console.error(`[itunes] search request threw for "${term}":`, err);
    return DEFAULT_COVER_ART;
  }
}
