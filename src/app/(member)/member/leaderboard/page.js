import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { user, memberProfile, division, role } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import LeaderboardMemberClient from "./LeaderboardMemberClient";
import { getAugmentedLeaderboard } from "@/lib/dummyLeaderboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leaderboard Poin & Ranking | SRE Portal",
  description: "Lihat daftar peringkat keaktifan member dan kumpulkan poin keaktifan XP.",
};

export default async function MemberLeaderboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Fetch leaderboard data filtered where user role is 'MEMBER'
  const data = await db
    .select({
      id: user.id,
      name: user.name,
      npm: user.npm,
      profilePictureUrl: user.profilePictureUrl,
      xp: memberProfile.xp,
      level: memberProfile.level,
      divisionName: division.name,
      roleName: role.name,
    })
    .from(memberProfile)
    .innerJoin(user, eq(user.id, memberProfile.userId))
    .leftJoin(role, eq(role.id, user.roleId))
    .leftJoin(division, eq(division.id, user.divisionId))
    .where(sql`LOWER(${role.name}) = 'member'`)
    .orderBy(desc(memberProfile.xp));

  const ranked = getAugmentedLeaderboard(data);

  return (
    <LeaderboardMemberClient
      initialLeaderboard={ranked}
      currentUserId={parseInt(session.user.id)}
    />
  );
}
