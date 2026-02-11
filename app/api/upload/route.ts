import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { put } from "@vercel/blob";
import { MAX_FILE_SIZE, isAllowedType } from "@/lib/upload";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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
