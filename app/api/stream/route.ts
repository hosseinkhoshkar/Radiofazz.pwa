export const runtime = "edge";

const STREAM_URL = "http://www.radiofaaz.com:8000/radiofaaz";

export async function GET() {
  let res: Response;
  try {
    res = await fetch(STREAM_URL, { cache: "no-store" });
  } catch {
    return new Response("Unable to reach stream server", { status: 502 });
  }

  if (!res.ok || !res.body) {
    return new Response("Stream unavailable", { status: 502 });
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
