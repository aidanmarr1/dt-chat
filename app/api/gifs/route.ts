import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { searchGifs, getCategories } from "@/lib/static-gifs";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "All";

  const results = searchGifs(q || undefined, category || undefined);

  const gifs = results.map((g) => ({
    id: g.id,
    title: g.title,
    preview: g.preview,
    url: g.url,
    width: g.width,
    height: g.height,
  }));

  return NextResponse.json({ gifs, categories: getCategories() });
}
