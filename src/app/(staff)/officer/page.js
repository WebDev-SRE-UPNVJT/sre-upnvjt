import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { user, attendance, literatureItem, documentItem } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import StaffDashboardClient from "./StaffDashboardClient";

export const dynamic = "force-dynamic";

export default async function StaffDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userIdInt = parseInt(session.user.id);

  // Fetch current user
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userIdInt),
    with: {
      role: true,
      department: true,
    }
  });

  if (!currentUser) redirect("/login");

  // Calculate attendance logs
  const attendanceLogs = await db.query.attendance.findMany({
    where: eq(attendance.memberId, userIdInt),
    orderBy: [desc(attendance.createdAt)],
  });

  const presentCount = attendanceLogs.filter(a => a.status === "PRESENT" || a.status === "LATE").length;

  // Fetch 5 latest literature items
  const latestLiterature = await db.query.literatureItem.findMany({
    where: eq(literatureItem.isPublished, true),
    orderBy: [desc(literatureItem.createdAt)],
    limit: 5,
    with: {
      category: true
    }
  });

  return (
    <StaffDashboardClient
      user={currentUser}
      presentCount={presentCount}
      latestLiterature={latestLiterature}
    />
  );
}
