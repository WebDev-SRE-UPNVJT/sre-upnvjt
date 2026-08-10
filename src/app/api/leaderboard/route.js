import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, memberProfile, division, xpTransaction, role } from "@/db/schema";
import { eq, desc, gte, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

/**
 * GET /api/leaderboard?period=all|month|week
 */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "all";

    let ranked = [];

    if (period === "all") {
      // All-time leaderboard from memberProfile
      const data = await db
        .select({
          id:                user.id,
          name:              user.name,
          npm:               user.npm,
          profilePictureUrl: user.profilePictureUrl,
          xp:                memberProfile.xp,
          level:             memberProfile.level,
          divisionName:      division.name,
          roleName:          role.name,
        })
        .from(memberProfile)
        .innerJoin(user, eq(user.id, memberProfile.userId))
        .leftJoin(role, eq(role.id, user.roleId))
        .leftJoin(division, eq(division.id, user.divisionId))
        .where(sql`LOWER(${role.name}) = 'member'`)
        .orderBy(desc(memberProfile.xp));

      ranked = data.map((item, idx) => ({ ...item, rank: idx + 1 }));

    } else {
      // Period-based query from xpTransaction
      const now = new Date();
      let startDate;

      if (period === "month") {
        // Awal bulan ini
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        // Awal minggu ini (Senin)
        const dayOfWeek = now.getDay();
        const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
        startDate = new Date(now);
        startDate.setDate(now.getDate() + diffToMonday);
        startDate.setHours(0, 0, 0, 0);
      }

      // SUM XP per user dari xpTransaction dalam rentang waktu
      const sumExpr = sql`COALESCE(SUM(${xpTransaction.amount}), 0)`;
      const xpByUser = await db
        .select({
          userId:   xpTransaction.userId,
          totalXp:  sumExpr,
        })
        .from(xpTransaction)
        .where(gte(xpTransaction.createdAt, startDate))
        .groupBy(xpTransaction.userId)
        .orderBy(desc(sumExpr));

      if (xpByUser.length === 0) {
        return NextResponse.json([]);
      }

      // Join dengan data user (hanya role MEMBER)
      const users = await db
        .select({
          id:                user.id,
          name:              user.name,
          npm:               user.npm,
          profilePictureUrl: user.profilePictureUrl,
          level:             memberProfile.level,
          divisionName:      division.name,
          roleName:          role.name,
        })
        .from(user)
        .leftJoin(role, eq(role.id, user.roleId))
        .leftJoin(memberProfile, eq(memberProfile.userId, user.id))
        .leftJoin(division, eq(division.id, user.divisionId))
        .where(sql`LOWER(${role.name}) = 'member'`);

      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

      ranked = xpByUser
        .filter((row) => Boolean(userMap[row.userId])) // Filter hanya user ber-role MEMBER
        .map((row, idx) => ({
          ...userMap[row.userId],
          xp:   Number(row.totalXp),
          rank: idx + 1,
        }));
    }

    return NextResponse.json(ranked);
  } catch (error) {
    console.error("[leaderboard] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
