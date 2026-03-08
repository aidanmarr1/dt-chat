import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { path: segments } = await params;
  // Fix URL normalization: [...path] catch-all collapses "://" to ":/"
  let fileName = segments.join("/");
  fileName = fileName.replace(/^(https?:\/)([^/])/, "$1/$2");

  // If the stored path is a full URL (Vercel Blob), handle it
  if (fileName.startsWith("http")) {
    let url: URL;
    try {
      url = new URL(fileName);
    } catch {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    const host = url.hostname.toLowerCase();
    if (
      host !== "blob.vercel-storage.com" &&
      !host.match(/^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/)
    ) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    // Download proxy mode: fetch server-side and stream back with Content-Disposition
    const isDownload = req.nextUrl.searchParams.get("download") === "1";
    if (isDownload) {
      try {
        const upstream = await fetch(fileName);
        if (!upstream.ok) {
          return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
        }
        const contentType = upstream.headers.get("content-type") || "application/octet-stream";
        // Extract filename from URL path
        const urlFileName = decodeURIComponent(url.pathname.split("/").pop() || "download");
        return new NextResponse(upstream.body, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${urlFileName}"`,
            "Cache-Control": "private, no-cache",
          },
        });
      } catch {
        return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
      }
    }

    // Default: redirect for display (img tags, etc.)
    return NextResponse.redirect(fileName);
  }

  // Local filesystem files are not supported in production
  return NextResponse.json({ error: "File not found" }, { status: 404 });
}
