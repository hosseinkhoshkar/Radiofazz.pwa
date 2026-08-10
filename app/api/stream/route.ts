export const runtime = "edge";

const STREAM_URL = "http://www.radiofaaz.com:8000/radiofaaz";
// Only guards the initial connect — once the origin responds with headers
// and a body stream, this timer is cleared so it can't cut an in-progress
// broadcast short.
const CONNECT_TIMEOUT_MS = 5000;

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(STREAM_URL, { cache: "no-store", signal: controller.signal });
  } catch {
    return new Response("Unable to reach stream server", { status: 502 });
  } finally {
    clearTimeout(timeout);
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
