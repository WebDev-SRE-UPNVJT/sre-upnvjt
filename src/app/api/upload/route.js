import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import path from 'path';

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://cdn.webly.biz.id/";

export async function POST(req) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const folder = data.get('folder') || '';
    const safeFolder = folder.split('/').map(part => part.replace(/[^a-zA-Z0-9_-]/g, '')).filter(Boolean).join('/');

    const prefix = safeFolder ? safeFolder.toUpperCase() : "FILE";
    const randomStr = Math.random().toString(36).substring(2, 8);
    const isImage = file.type?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(file.name);

    let filename;
    let processedBuffer;
    let contentType;

    if (isImage) {
      const sharp = (await import("sharp")).default;
      filename = `${prefix}_${Date.now()}_${randomStr}.webp`;
      processedBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
      contentType = "image/webp";
    } else {
      const ext = path.extname(file.name);
      filename = `${prefix}_${Date.now()}_${randomStr}${ext}`;
      processedBuffer = buffer;
      contentType = file.type || "application/octet-stream";
    }

    const r2Key = safeFolder ? `${safeFolder}/${filename}` : filename;

    // Upload to Cloudflare R2
    const { uploadToR2 } = await import("@/lib/r2");
    const key = await uploadToR2(processedBuffer, r2Key, contentType);

    // Build full public URL
    const base = R2_PUBLIC_URL.endsWith("/") ? R2_PUBLIC_URL : R2_PUBLIC_URL + "/";
    const publicUrl = `${base}${key}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
