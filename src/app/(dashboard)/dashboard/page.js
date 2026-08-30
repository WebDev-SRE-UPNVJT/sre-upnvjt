import React from "react";
import DashboardClient from "./DashboardClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDashboardStats } from "@/app/actions/dashboardActions";
import { user, role } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Overview | SRE Portal",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  let currentUser = {
    id: parseInt(session.user.id) || 0,
    name: session.user.name || "User",
    email: session.user.email || "",
    departmentId: null,
    role: { name: session.user.roleName || "" },
  };

  try {
    const usersResult = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        departmentId: user.departmentId,
        roleName: role.name,
      })
      .from(user)
      .leftJoin(role, eq(user.roleId, role.id))
      .where(eq(user.email, session.user.email))
      .limit(1);

    if (usersResult && usersResult.length > 0) {
      currentUser = {
        ...usersResult[0],
        role: { name: usersResult[0].roleName || session.user.roleName || "" },
      };
    }
  } catch (err) {
    console.error("[DashboardPage] Error querying current user:", err);
  }

  let stats = null;
  try {
    const roleName = currentUser.role?.name || "";
    const statsResponse = await getDashboardStats(roleName, currentUser.departmentId, currentUser.id);
    stats = statsResponse?.success ? statsResponse.data : null;
  } catch (err) {
    console.error("[DashboardPage] Error getting stats:", err);
  }

  return <DashboardClient stats={stats} user={currentUser} />;
}
