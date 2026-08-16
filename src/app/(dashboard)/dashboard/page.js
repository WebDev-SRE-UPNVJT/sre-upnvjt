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
  
  console.log("=== DashboardPage Server-side Debug ===");
  console.log("Session:", JSON.stringify(session));

  if (!session) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/40 rounded-xl m-8 relative z-50">
        <h2 className="text-xl font-bold mb-4">Debug: No Session Found</h2>
        <p className="mb-4">getServerSession returned null on /dashboard/page.js.</p>
        <a href="/login" className="bg-red-700 text-white px-4 py-2 rounded">Go to Login</a>
      </div>
    );
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
    return (
      <div className="p-8 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/40 rounded-xl m-8 relative z-50">
        <h2 className="text-xl font-bold mb-4">Debug: usersResult Empty</h2>
        <p className="mb-2">No user found in database for email: <strong>{session.user?.email || "undefined"}</strong></p>
        <p className="mb-4">Session info:</p>
        <pre className="p-4 bg-black/10 rounded overflow-auto text-xs mb-4">{JSON.stringify(session, null, 2)}</pre>
        <a href="/login" className="bg-amber-700 text-white px-4 py-2 rounded inline-block">Go to Login</a>
      </div>
    );
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
