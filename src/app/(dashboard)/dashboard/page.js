import React from "react";
import DashboardClient from "./DashboardClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
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
  
  if (!session) {
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

  if (!usersResult || usersResult.length === 0) redirect("/login");

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
