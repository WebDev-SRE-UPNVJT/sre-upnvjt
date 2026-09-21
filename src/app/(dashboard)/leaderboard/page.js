import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { user, memberProfile, division, role, department } from "@/db/schema";
import { eq, desc, asc, sql, and } from "drizzle-orm";
import LeaderboardClient from "./LeaderboardClient";
import { getAugmentedLeaderboard } from "@/lib/dummyLeaderboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leaderboard Admin | SRE Portal",
  description: "Pantau ranking XP dan berikan XP manual kepada anggota SRE UPNVJT.",
};

export default async function LeaderboardAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user, "leaderboard", "read")) {
    redirect("/dashboard");
  }

  // Fetch leaderboard data (Khusus role MEMBER & Exclude Departemen SYS)
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

  // Fetch users list for manual XP award modal (Khusus role MEMBER & non-SYS)
  const members = await db
    .select({
      id: user.id,
      name: user.name,
    })
    .from(user)
    .innerJoin(role, eq(role.id, user.roleId))
    .leftJoin(department, eq(department.id, user.departmentId))
    .leftJoin(division, eq(division.id, user.divisionId))
    .where(
      and(
        eq(user.isActive, true),
        sql`LOWER(${role.name}) = 'member'`,
        sql`COALESCE(LOWER(${department.code}), '') NOT IN ('sys', 'system')`,
        sql`COALESCE(LOWER(${department.name}), '') NOT LIKE '%sys%'`,
        sql`COALESCE(LOWER(${division.name}), '') NOT LIKE '%sys%'`
      )
    )
    .orderBy(asc(user.name));

  return (
    <LeaderboardClient
      initialLeaderboard={ranked}
      members={members}
      currentUser={session.user}
    />
  );
}
