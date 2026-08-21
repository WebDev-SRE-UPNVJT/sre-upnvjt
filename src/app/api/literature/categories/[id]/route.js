import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { literatureCategory } from "@/db/schema";
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
    const { name, imageUrl, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
    }

    const [updated] = await db.update(literatureCategory)
      .set({ name, imageUrl: imageUrl || null, description: description || null })
      .where(eq(literatureCategory.id, id))
      .returning();

    return NextResponse.json({ success: true, category: updated });
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
    const existing = await db.query.literatureCategory.findFirst({ where: eq(literatureCategory.id, id) });
    await db.delete(literatureCategory).where(eq(literatureCategory.id, id));

    if (existing?.imageUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.imageUrl);
      } catch (r2Err) {
        console.warn("Failed to delete literature category image from R2:", r2Err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
