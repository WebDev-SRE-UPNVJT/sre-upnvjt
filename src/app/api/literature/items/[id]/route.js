import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { literatureItem } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const body = await req.json();
    const { categoryId, title, author, year, driveUrl, type, abstract, abstractId, keywords, keywordsId, isPublished } = body;

    if (!title || !driveUrl || !categoryId) {
      return NextResponse.json({ error: "Judul, kategori, dan link wajib diisi" }, { status: 400 });
    }

    await db.update(literatureItem).set({
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
    }).where(eq(literatureItem.id, id));

    const updated = await db.query.literatureItem.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      with: { category: { columns: { id: true, name: true, imageUrl: true } } },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    await db.delete(literatureItem).where(eq(literatureItem.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
