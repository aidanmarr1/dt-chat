import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { put } from "@vercel/blob";
import { MAX_FILE_SIZE, isAllowedType } from "@/lib/upload";
import { createRateLimiter } from "@/lib/rate-limit";

const checkUploadRateLimit = createRateLimiter({ maxAttempts: 20, windowMs: 60 * 1000 });

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!checkUploadRateLimit(user.id)) {
    return NextResponse.json({ error: "Too many uploads. Please slow down." }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  if (!isAllowedType(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  // Validate magic bytes for image uploads to prevent MIME spoofing
  const IMAGE_MAGIC: Record<string, (bytes: Uint8Array) => boolean> = {
    "image/jpeg": (b) => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF,
    "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47,
    "image/gif": (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46,
    "image/webp": (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  };

  const magicCheck = IMAGE_MAGIC[file.type];
  if (magicCheck) {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (!magicCheck(header)) {
      return NextResponse.json({ error: "File content does not match claimed type" }, { status: 400 });
    }
  }

  const ext = file.name.split(".").pop() || "";
  const safeName = `${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

  const blob = await put(safeName, file, {
    access: "public",
    contentType: file.type,
  });

  return NextResponse.json({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    filePath: blob.url,
  });
}
