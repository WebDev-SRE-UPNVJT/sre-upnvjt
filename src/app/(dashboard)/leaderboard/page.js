import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { user, memberProfile, division } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
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

  // Fetch leaderboard data
  const data = await db
    .select({
      id: user.id,
      name: user.name,
      npm: user.npm,
      profilePictureUrl: user.profilePictureUrl,
      xp: memberProfile.xp,
      level: memberProfile.level,
      divisionName: division.name,
    })
    .from(memberProfile)
    .innerJoin(user, eq(user.id, memberProfile.userId))
    .leftJoin(division, eq(division.id, user.divisionId))
    .orderBy(desc(memberProfile.xp));

  const ranked = getAugmentedLeaderboard(data);

  // Fetch users list for manual XP award modal
  const members = await db.query.user.findMany({
    where: eq(user.isActive, true),
    orderBy: [asc(user.name)],
    columns: { id: true, name: true },
  });

  return (
    <LeaderboardClient
      initialLeaderboard={ranked}
      members={members}
      currentUser={session.user}
    />
  );
}
