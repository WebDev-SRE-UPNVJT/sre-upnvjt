import React from "react";
import DashboardClient from "./DashboardClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDashboardStats } from "@/app/actions/dashboardActions";

export const dynamic = "force-dynamic";

import { user, role } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata = {
  title: "Dashboard Overview | SRE Portal",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  console.log("=== DashboardPage Server-side Debug ===");
  console.log("Session:", JSON.stringify(session));

  if (!session) {
    console.log("Redirecting to /login: No session found");
    redirect("/login");
  }

  const usersResult = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    departmentId: user.departmentId,
    roleName: role.name
  })
  .from(user)
  .leftJoin(role, eq(user.roleId, role.id))
  .where(eq(user.email, session.user.email))
  .limit(1);

  console.log("usersResult:", JSON.stringify(usersResult));

  if (!usersResult || usersResult.length === 0) {
    console.log("Redirecting to /login: usersResult is empty or null for email", session.user.email);
    redirect("/login");
  }

  const currentUser = {
    ...usersResult[0],
    role: { name: usersResult[0].roleName }
  };

  const roleName = currentUser.role?.name || "";
  const departmentId = currentUser.departmentId;

  console.log("Calling getDashboardStats with role:", currentUser.role.name, "dept:", currentUser.departmentId, "id:", currentUser.id);
  const statsResponse = await getDashboardStats(currentUser.role.name, currentUser.departmentId, currentUser.id);
  console.log("statsResponse:", JSON.stringify(statsResponse));
  const stats = statsResponse.success ? statsResponse.data : null;

  return <DashboardClient stats={stats} user={currentUser} />;
}
