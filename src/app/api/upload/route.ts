import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File exceeds 4MB limit" },
      { status: 400 }
    );
  }

  const mimeType = file.type;
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, and GIF images are allowed" },
      { status: 400 }
    );
  }

  // Ensure upload directory exists
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${crypto.randomBytes(16).toString("hex")}.webp`;
  const filepath = path.join(UPLOAD_DIR, filename);

  // Resize to max 1920px width, convert to webp
  await sharp(buffer)
    .resize(1920, null, {
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: 82 })
    .toFile(filepath);

  return NextResponse.json({ path: `/api/uploads/${filename}` });
}
