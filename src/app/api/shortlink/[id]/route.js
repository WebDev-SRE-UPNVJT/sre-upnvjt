import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";
import { shortlink } from "@/db/schema";
import { eq, sql, and, ne } from "drizzle-orm";

export const dynamic = 'force-dynamic';

// PUT: Update a shortlink (or toggle isActive status)
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const linkId = Number(id);
    if (isNaN(linkId)) {
      return NextResponse.json({ error: "Invalid link ID" }, { status: 400 });
    }

    const body = await req.json();
    const { slug, originalUrl, description, isActive } = body;

    const existingLink = await db.query.shortlink.findFirst({
      where: eq(shortlink.id, linkId),
    });

    if (!existingLink) {
      return NextResponse.json({ error: "Shortlink not found" }, { status: 404 });
    }

    const updateData = {};

    if (slug !== undefined) {
      const cleanSlug = slug.trim().toLowerCase();
      if (cleanSlug !== existingLink.slug.toLowerCase()) {
        const slugExists = await db
          .select({ id: shortlink.id })
          .from(shortlink)
          .where(and(sql`LOWER(${shortlink.slug}) = LOWER(${cleanSlug})`, ne(shortlink.id, linkId)))
          .limit(1);

        if (slugExists.length > 0) {
          return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
        }
      }
      updateData.slug = cleanSlug;
    }

    if (originalUrl !== undefined) updateData.originalUrl = originalUrl.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await db
      .update(shortlink)
      .set(updateData)
      .where(eq(shortlink.id, linkId))
      .returning();

    const formatted = {
      ...updated[0],
      clicks: Number(updated[0].clicks) || 0,
      creatorName: session.user.name || 'Staff',
      createdAt: updated[0].createdAt ? (updated[0].createdAt instanceof Date ? updated[0].createdAt.toISOString() : new Date(updated[0].createdAt).toISOString()) : null,
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to update shortlink:", error);
    return NextResponse.json({ error: error.message || "Failed to update shortlink" }, { status: 500 });
  }
}

// DELETE: Remove a shortlink
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const linkId = Number(id);
    if (isNaN(linkId)) {
      return NextResponse.json({ error: "Invalid link ID" }, { status: 400 });
    }

    const deleted = await db
      .delete(shortlink)
      .where(eq(shortlink.id, linkId))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Shortlink not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Shortlink deleted successfully" });
  } catch (error) {
    console.error("Failed to delete shortlink:", error);
    return NextResponse.json({ error: error.message || "Failed to delete shortlink" }, { status: 500 });
  }
}
