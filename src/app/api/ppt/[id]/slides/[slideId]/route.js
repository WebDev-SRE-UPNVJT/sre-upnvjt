import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pptSlide } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const slideId = parseInt(resolvedParams.slideId);
    const body = await req.json();
    const { title, fileUrl, order } = body;

    if (!fileUrl) {
      return NextResponse.json({ error: "File URL wajib diisi" }, { status: 400 });
    }

    const [updated] = await db.update(pptSlide)
      .set({
        title: title || null,
        fileUrl,
        ...(order !== undefined ? { order: parseInt(order) } : {}),
      })
      .where(eq(pptSlide.id, slideId))
      .returning();

    return NextResponse.json({ success: true, slide: updated });
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
    const slideId = parseInt(resolvedParams.slideId);
    const moduleId = parseInt(resolvedParams.id);

    // Fetch slide to get fileUrl for R2 deletion
    const slide = await db.query.pptSlide.findFirst({
      where: eq(pptSlide.id, slideId),
    });

    if (slide?.fileUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(slide.fileUrl);
      } catch (r2Err) {
        console.warn("Failed to delete slide image from R2:", r2Err);
      }
    }

    await db.delete(pptSlide).where(eq(pptSlide.id, slideId));

    // Re-sequence remaining slides in this module
    const remaining = await db.query.pptSlide.findMany({
      where: (t, { eq }) => eq(t.moduleId, moduleId),
      orderBy: [asc(pptSlide.order)],
    });

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].order !== i + 1) {
        await db.update(pptSlide)
          .set({ order: i + 1 })
          .where(eq(pptSlide.id, remaining[i].id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
