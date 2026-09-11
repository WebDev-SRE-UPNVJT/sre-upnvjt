import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { literatureItem } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
  try {
    const items = await db.query.literatureItem.findMany({
      orderBy: [desc(literatureItem.createdAt)],
      with: {
        category: { columns: { id: true, name: true, imageUrl: true } },
      },
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { categoryId, title, author, year, driveUrl, type, abstract, abstractId, keywords, keywordsId, isPublished } = body;

    if (!title || !driveUrl || !categoryId) {
      return NextResponse.json({ error: "Judul, kategori, dan link wajib diisi" }, { status: 400 });
    }

    const [result] = await db.insert(literatureItem).values({
      categoryId: parseInt(categoryId),
      title,
      author: author || null,
      year: year ? parseInt(year) : null,
      driveUrl,
      type: type || null,
      abstract: abstract || null,
      abstractId: abstractId || null,
      keywords: keywords || null,
      keywordsId: keywordsId || null,
      isPublished: isPublished === true || isPublished === "true",
      uploadedById: session.user.id,
    }).returning();

    // Re-fetch with category for consistent response shape
    const full = await db.query.literatureItem.findFirst({
      where: (t, { eq }) => eq(t.id, result.id),
      with: { category: { columns: { id: true, name: true, imageUrl: true } } },
    });

    return NextResponse.json({ success: true, item: full }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
