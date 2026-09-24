import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { user, memberProfile, division, role, department } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import LeaderboardMemberClient from "./LeaderboardMemberClient";
import { getAugmentedLeaderboard } from "@/lib/dummyLeaderboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leaderboard Poin & Ranking | SRE Portal",
  description: "Lihat daftar peringkat keaktifan member dan kumpulkan poin keaktifan XP.",
};

export default async function MemberLeaderboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const userIdInt = parseInt(session.user.id);
  if (isNaN(userIdInt)) {
    redirect("/login");
  }

  // Fetch leaderboard data filtered where user role is 'MEMBER' & exclude SYS department
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
    .leftJoin(department, eq(department.id, user.departmentId))
    .leftJoin(division, eq(division.id, user.divisionId))
    .where(
      and(
        sql`LOWER(${role.name}) = 'member'`,
        sql`COALESCE(LOWER(${department.code}), '') NOT IN ('sys', 'system')`,
        sql`COALESCE(LOWER(${department.name}), '') NOT LIKE '%sys%'`,
        sql`COALESCE(LOWER(${division.name}), '') NOT LIKE '%sys%'`
      )
    )
    .orderBy(desc(memberProfile.xp));

  const ranked = getAugmentedLeaderboard(data);

  return (
    <LeaderboardMemberClient
      initialLeaderboard={ranked}
      currentUserId={parseInt(session.user.id)}
    />
  );
}
