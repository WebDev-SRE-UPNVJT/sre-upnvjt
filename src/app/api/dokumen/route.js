import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documentItem, documentCategory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { Readable } from "stream";

/**
 * GET /api/dokumen  — Ambil semua dokumen yang diupload user ini
 */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const docs = await db.query.documentItem.findMany({
      where: eq(documentItem.uploadedById, parseInt(session.user.id)),
      orderBy: [desc(documentItem.createdAt)],
      with: { category: true },
    });

    return NextResponse.json(docs);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/dokumen  — Upload dokumen ke Google Drive + simpan ke DB
 *
 * Body: multipart/form-data
 *   - file: File
 *   - categoryId: string (number)
 *   - title: string
 *   - description: string (optional)
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData    = await req.formData();
    const file        = formData.get("file");
    const categoryId  = parseInt(formData.get("categoryId"));
    const title       = formData.get("title")?.toString().trim();
    const description = formData.get("description")?.toString().trim() || null;

    if (!file || !categoryId || !title) {
      return NextResponse.json({ error: "File, kategori, dan judul wajib diisi" }, { status: 400 });
    }

    // Upload to Google Drive
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const stream = Readable.from(buffer);

    const safeName   = session.user.name.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName   = `${safeName}_${Date.now()}_${file.name}`;
    const folderId   = process.env.GOOGLE_DRIVE_DOKUMEN_FOLDER_ID ?? process.env.GOOGLE_DRIVE_FOLDER_ID;

    const uploaded = await drive.files.create({
      requestBody: { name: fileName, parents: [folderId] },
      media: { mimeType: file.type, body: stream },
      fields: "id, webViewLink",
      supportsAllDrives: true,
    });

    // Set public read
    await drive.permissions.create({
      fileId: uploaded.data.id,
      requestBody: { role: "reader", type: "anyone" },
      supportsAllDrives: true,
    });

    // Save to DB
    const [inserted] = await db.insert(documentItem).values({
      categoryId,
      title,
      description,
      fileUrl:      uploaded.data.webViewLink,
      uploadedById: parseInt(session.user.id),
    }).returning();

    // Fetch with category relation
    const withCat = await db.query.documentItem.findFirst({
      where: eq(documentItem.id, inserted.id),
      with: { category: true },
    });

    return NextResponse.json({ success: true, document: withCat }, { status: 201 });
  } catch (err) {
    console.error("[dokumen/POST]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
