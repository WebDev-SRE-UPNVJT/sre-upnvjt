import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { testimonial } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const body = await req.json();
    const { authorName, authorPosition, authorPhotoUrl, content, isPublished } = body;

    if (!authorName || !authorPosition || !content) {
      return NextResponse.json({ error: "Nama, jabatan, dan isi testimoni wajib diisi" }, { status: 400 });
    }

    const existing = await db.query.testimonial.findFirst({ where: eq(testimonial.id, id) });
    if (authorPhotoUrl !== undefined && existing?.authorPhotoUrl && existing.authorPhotoUrl !== authorPhotoUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.authorPhotoUrl);
      } catch (r2Err) {
        console.warn("Failed to delete old testimonial photo from R2:", r2Err);
      }
    }

    const [updated] = await db.update(testimonial)
      .set({
        authorName,
        authorPosition,
        authorPhotoUrl: authorPhotoUrl || null,
        content,
        isPublished: Boolean(isPublished),
      })
      .where(eq(testimonial.id, id))
      .returning();

    return NextResponse.json({ success: true, testimonial: updated });
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
    const existing = await db.query.testimonial.findFirst({ where: eq(testimonial.id, id) });
    await db.delete(testimonial).where(eq(testimonial.id, id));

    if (existing?.authorPhotoUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.authorPhotoUrl);
      } catch (r2Err) {
        console.warn("Failed to delete testimonial photo from R2:", r2Err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
