import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { partner } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    if (session.user.roleName !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only SUPER_ADMIN can edit partners" }, { status: 403 });
    }

    const { id } = await params;
    const partnerId = parseInt(id);
    const body = await req.json();
    const { name, logoUrl, websiteUrl, tier, isActive } = body;

    if (!name || !logoUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await db.query.partner.findFirst({ where: eq(partner.id, partnerId) });
    if (logoUrl !== undefined && existing?.logoUrl && existing.logoUrl !== logoUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.logoUrl);
      } catch (r2Err) {
        console.warn("Failed to delete old partner logo from R2:", r2Err);
      }
    }

    await db.update(partner).set({
      name,
      logoUrl,
      websiteUrl: websiteUrl || null,
      tier: tier || null,
      isActive: isActive !== undefined ? isActive : true,
    }).where(eq(partner.id, partnerId));

    return NextResponse.json({ success: true, partner: { id: partnerId, name, logoUrl, websiteUrl, tier, isActive: isActive !== undefined ? isActive : true } }, { status: 200 });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.roleName !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only SUPER_ADMIN can delete partners" }, { status: 403 });
    }

    const { id } = await params;
    const partnerId = parseInt(id);

    const existing = await db.query.partner.findFirst({ where: eq(partner.id, partnerId) });
    await db.delete(partner).where(eq(partner.id, partnerId));

    if (existing?.logoUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.logoUrl);
      } catch (r2Err) {
        console.warn("Failed to delete partner logo from R2:", r2Err);
      }
    }

    return NextResponse.json({ success: true, message: "Partner deleted" }, { status: 200 });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
