import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { path: segments } = await params;
  const fileName = segments.join("/");

  // If the stored path is a full URL (Vercel Blob), redirect to it
  if (fileName.startsWith("http")) {
    try {
      const url = new URL(fileName);
      if (!url.hostname.endsWith(".vercel-storage.com") && !url.hostname.endsWith(".blob.vercel-storage.com")) {
        return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
      }
      return NextResponse.redirect(fileName);
    } catch {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }
  }

  // Local filesystem files are not supported in production
  return NextResponse.json({ error: "File not found" }, { status: 404 });
}
