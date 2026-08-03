const STATUS_URL = "http://www.radiofaaz.com:8000/status-json.xsl";
const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

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

export async function GET() {
  try {
    const res = await fetch(STATUS_URL, { cache: "no-store" });

    if (!res.ok) {
      return Response.json(
        { error: "Failed to fetch stream status" },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    const data = await res.json();
    const rawSource = data?.icestats?.source;
    const sources: IcecastSource[] = Array.isArray(rawSource)
      ? rawSource
      : rawSource
        ? [rawSource]
        : [];

    const nowPlaying = sources.map((source) => {
      const { artist, track } = splitTitle(source.title);
      return {
        mount: source.listenurl ?? null,
        artist,
        track,
        listeners: source.listeners ?? 0,
      };
    });

    return Response.json({ sources: nowPlaying }, { headers: CORS_HEADERS });
  } catch {
    return Response.json(
      { error: "Unable to reach stream server" },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}
