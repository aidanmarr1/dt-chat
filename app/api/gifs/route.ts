import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = process.env.TENOR_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GIF service not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limit = 20;

  const endpoint = q
    ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${apiKey}&client_key=dt-chat&limit=${limit}&media_filter=tinygif,gif`
    : `https://tenor.googleapis.com/v2/featured?key=${apiKey}&client_key=dt-chat&limit=${limit}&media_filter=tinygif,gif`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch GIFs" }, { status: 502 });
    }
    const data = await res.json();

    const gifs = (data.results || []).map((r: Record<string, unknown>) => {
      const media = r.media_formats as Record<string, { url: string; dims: number[] }> | undefined;
      return {
        id: r.id,
        title: r.title || "",
        preview: media?.tinygif?.url || media?.gif?.url || "",
        url: media?.gif?.url || media?.tinygif?.url || "",
        width: media?.tinygif?.dims?.[0] || 200,
        height: media?.tinygif?.dims?.[1] || 200,
      };
    });

    return NextResponse.json({ gifs });
  } catch {
    return NextResponse.json({ error: "GIF service unavailable" }, { status: 502 });
  }
}
