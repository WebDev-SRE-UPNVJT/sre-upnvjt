import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import sharp from "sharp";

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

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeFolder);
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }

    const prefix = safeFolder ? safeFolder.toUpperCase() : "FILE";
    const randomStr = Math.random().toString(36).substring(2, 8);
    const isImage = file.type?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(file.name);

    let filename;
    let processedBuffer;
    let contentType;

    if (isImage) {
      filename = `${prefix}_${Date.now()}_${randomStr}.webp`;
      processedBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
      contentType = "image/webp";
    } else {
      const ext = path.extname(file.name);
      filename = `${prefix}_${Date.now()}_${randomStr}${ext}`;
      processedBuffer = buffer;
      contentType = file.type || "application/octet-stream";
    }

    // For ppt-covers (or explicit local folders), save directly to local disk
    if (safeFolder === 'ppt-covers') {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeFolder);
      await mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, processedBuffer);
      const publicUrl = `/uploads/${safeFolder}/${filename}`;
      return NextResponse.json({ success: true, url: publicUrl });
    }

    const r2Key = safeFolder ? `${safeFolder}/${filename}` : filename;

    // Upload to Cloudflare R2
    let publicUrl;
    try {
      const { uploadToR2 } = await import("@/lib/r2");
      publicUrl = await uploadToR2(processedBuffer, r2Key, contentType);
    } catch (r2Error) {
      console.warn("Cloudflare R2 Upload failed, falling back to local disk storage:", r2Error);
      // Local fallback
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeFolder);
      await mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, processedBuffer);
      publicUrl = safeFolder ? `/uploads/${safeFolder}/${filename}` : `/uploads/${filename}`;
    }

    // Return the URL/key
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
