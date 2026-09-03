import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { shortlink } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { hasAccess } from "@/lib/permissions";

// PUT: Update a shortlink (or toggle isActive status)
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { slug, originalUrl, description, isActive } = body;

    const existingLink = await db.query.shortlink.findFirst({
      where: eq(shortlink.id, Number(id)),
    });

    if (!existingLink) {
      return NextResponse.json({ error: "Shortlink not found" }, { status: 404 });
    }

    // Check if slug is taken by another link
    if (slug && slug !== existingLink.slug) {
      const slugExists = await db.query.shortlink.findFirst({
        where: eq(shortlink.slug, slug),
      });

      if (slugExists && slugExists.id !== Number(id)) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
      }
    }

    const updateData = {};
    if (slug !== undefined) updateData.slug = slug;
    if (originalUrl !== undefined) updateData.originalUrl = originalUrl;
    if (description !== undefined) updateData.description = description || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await db
      .update(shortlink)
      .set(updateData)
      .where(eq(shortlink.id, Number(id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Failed to update shortlink:", error);
    return NextResponse.json({ error: "Failed to update shortlink" }, { status: 500 });
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

    const deleted = await db
      .delete(shortlink)
      .where(eq(shortlink.id, Number(id)))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Shortlink not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Shortlink deleted successfully" });
  } catch (error) {
    console.error("Failed to delete shortlink:", error);
    return NextResponse.json({ error: "Failed to delete shortlink" }, { status: 500 });
  }
}
