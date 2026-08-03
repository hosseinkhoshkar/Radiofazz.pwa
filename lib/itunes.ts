const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";

export const DEFAULT_COVER_ART = "/cover-placeholder.svg";

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
  const term = [artist, track].filter(Boolean).join(" ").trim();
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
      return DEFAULT_COVER_ART;
    }

    const data: ItunesSearchResponse = await res.json();
    const artwork = data.results?.[0]?.artworkUrl100;
    if (!artwork) {
      return DEFAULT_COVER_ART;
    }

    return artwork.replace("100x100bb", "600x600bb");
  } catch {
    return DEFAULT_COVER_ART;
  }
}
