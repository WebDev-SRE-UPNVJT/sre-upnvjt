import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import path from 'path';
import { uploadToR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://cdn.webly.biz.id/";

async function getSharp() {
  try {
    const sharpModule = await import('sharp');
    return sharpModule.default || sharpModule;
  } catch (err) {
    console.warn("[upload] Sharp native library not available, skipping webp conversion:", err?.message || err);
    return null;
  }
}

export async function POST(req) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Sesi login tidak valid. Silakan login kembali." }, { status: 401 });
    }

    const data = await req.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const folder = data.get('folder') || '';
    const safeFolder = folder.split('/').map(part => part.replace(/[^a-zA-Z0-9_-]/g, '')).filter(Boolean).join('/');

    // Extract a clean file base name without paths or slashes
    const rawBase = file.name ? path.parse(file.name).name : 'file';
    const cleanBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '') || 'file';

    const isImage = file.type?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|avif|bmp|tiff|heic|heif)$/i.test(file.name || '');
    const randomStr = Math.random().toString(36).substring(2, 8);

    let filename;
    let processedBuffer = buffer;
    let contentType = file.type || "application/octet-stream";

    if (isImage) {
      let webpSuccess = false;
      try {
        const sharpFn = await getSharp();
        if (sharpFn && typeof sharpFn === "function") {
          processedBuffer = await sharpFn(buffer)
            .rotate()
            .webp({ quality: 82, effort: 4 })
            .toBuffer();
          filename = `${cleanBase}_${Date.now()}_${randomStr}.webp`;
          contentType = "image/webp";
          webpSuccess = true;
        }
      } catch (sharpErr) {
        console.error("Sharp WebP conversion error:", sharpErr);
      }

      if (!webpSuccess) {
        const ext = path.extname(file.name || '') || (file.type ? `.${file.type.split('/')[1]}` : '.jpg');
        filename = `${cleanBase}_${Date.now()}_${randomStr}${ext}`;
        processedBuffer = buffer;
        contentType = file.type || "application/octet-stream";
      }
    } else {
      const ext = path.extname(file.name || '');
      filename = `${cleanBase}_${Date.now()}_${randomStr}${ext}`;
      processedBuffer = buffer;
      contentType = file.type || "application/octet-stream";
    }

    const r2Key = safeFolder ? `${safeFolder}/${filename}` : filename;

    // Upload to Cloudflare R2
    const key = await uploadToR2(processedBuffer, r2Key, contentType);

    // Build full public URL
    const base = R2_PUBLIC_URL.endsWith("/") ? R2_PUBLIC_URL : R2_PUBLIC_URL + "/";
    const publicUrl = `${base}${key}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Upload API route error:", error);
    return NextResponse.json({ error: error.message || "Gagal mengunggah file ke server" }, { status: 500 });
  }
}
