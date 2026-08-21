import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pptModule, pptSlide } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const mod = await db.query.pptModule.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      with: {
        slides: { orderBy: [asc(pptSlide.order)] },
      },
    });

    if (!mod) return NextResponse.json({ error: "Module not found" }, { status: 404 });
    return NextResponse.json(mod);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const body = await req.json();
    const { title, description, notes, coverImageUrl, isPublished } = body;

    if (!title) {
      return NextResponse.json({ error: "Judul modul wajib diisi" }, { status: 400 });
    }

    const [updated] = await db.update(pptModule)
      .set({
        title,
        description: description || null,
        notes: notes || null,
        coverImageUrl: coverImageUrl || null,
        isPublished: Boolean(isPublished),
        updatedAt: new Date(),
      })
      .where(eq(pptModule.id, id))
      .returning();

    return NextResponse.json({ success: true, module: updated });
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

    const mod = await db.query.pptModule.findFirst({ where: eq(pptModule.id, id) });
    // Fetch all slides in module to remove slide images from R2
    const slides = await db.query.pptSlide.findMany({
      where: eq(pptSlide.moduleId, id),
    });

    try {
      const { deleteFromR2 } = await import("@/lib/r2");
      if (mod?.coverImageUrl) {
        await deleteFromR2(mod.coverImageUrl);
      }
      for (const slide of slides) {
        if (slide.fileUrl) {
          await deleteFromR2(slide.fileUrl);
        }
      }
    } catch (r2Err) {
      console.warn("Failed to delete PPT files from R2 during module deletion:", r2Err);
    }

    // Delete slides first (FK constraint)
    await db.delete(pptSlide).where(eq(pptSlide.moduleId, id));
    await db.delete(pptModule).where(eq(pptModule.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
