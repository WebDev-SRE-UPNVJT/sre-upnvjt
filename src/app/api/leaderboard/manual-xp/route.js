import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { memberProfile, xpTransaction } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { calculateLevel } from "@/lib/leveling";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // "Tambah XP Manual" button (SUPER_ADMIN only)
    if (session.user.roleName !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, amount, reason } = body;

    if (!userId || !amount || !reason) {
      return NextResponse.json({ error: "Anggota, jumlah XP, dan alasan wajib diisi" }, { status: 400 });
    }

    const targetUserId = parseInt(userId);
    const xpAmount = parseInt(amount);

    // Fetch profile
    const profile = await db.query.memberProfile.findFirst({
      where: eq(memberProfile.userId, targetUserId),
    });

    if (!profile) {
      await db.insert(memberProfile).values({
        userId: targetUserId,
        xp: xpAmount,
        level: calculateLevel(xpAmount),
      });
    } else {
      const nextXp = profile.xp + xpAmount;
      const nextLevel = calculateLevel(nextXp);
      await db.update(memberProfile)
        .set({ xp: nextXp, level: nextLevel })
        .where(eq(memberProfile.userId, targetUserId));
    }

    // Log transaction
    const [result] = await db.insert(xpTransaction).values({
      userId: targetUserId,
      amount: xpAmount,
      reason,
      sourceType: "manual",
      sourceId: null,
      grantedById: session.user.id,
    }).returning();

    return NextResponse.json({ success: true, transaction: result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
