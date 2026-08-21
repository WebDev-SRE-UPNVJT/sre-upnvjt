import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { event, eventRegistration } from "@/db/schema";
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
    const { title, description, bannerUrl, eventDate, location, category, registrationType } = body;

    if (!title || !eventDate) {
      return NextResponse.json({ error: "Judul dan tanggal event wajib diisi" }, { status: 400 });
    }

    const existing = await db.query.event.findFirst({ where: eq(event.id, id) });
    if (bannerUrl !== undefined && existing?.bannerUrl && existing.bannerUrl !== bannerUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.bannerUrl);
      } catch (r2Err) {
        console.warn("Failed to delete old event banner from R2:", r2Err);
      }
    }

    const [updated] = await db.update(event)
      .set({
        title,
        description: description || null,
        bannerUrl: bannerUrl || null,
        eventDate: new Date(eventDate),
        location: location || null,
        category: category || null,
        registrationType: registrationType || "OPEN",
      })
      .where(eq(event.id, id))
      .returning();

    return NextResponse.json({ success: true, event: updated });
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
    const existing = await db.query.event.findFirst({ where: eq(event.id, id) });

    if (existing?.bannerUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.bannerUrl);
      } catch (r2Err) {
        console.warn("Failed to delete event banner from R2:", r2Err);
      }
    }

    // Delete registrations first (FK constraint)
    await db.delete(eventRegistration).where(eq(eventRegistration.eventId, id));
    await db.delete(event).where(eq(event.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
