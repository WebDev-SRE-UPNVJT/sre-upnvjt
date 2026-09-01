import React from "react";
import DashboardClient from "./DashboardClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/app/actions/dashboardActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Overview | SRE Portal",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const currentUser = {
    id: parseInt(session.user.id) || 0,
    name: session.user.name || "User",
    email: session.user.email || "",
    departmentId: session.user.departmentId || null,
    role: { name: session.user.roleName || "" },
  };

  let stats = null;
  try {
    const statsResponse = await getDashboardStats();
    stats = statsResponse?.success ? statsResponse.data : null;
  } catch (err) {
    console.error("[DashboardPage] Error getting stats:", err);
  }

  return <DashboardClient stats={stats} user={currentUser} />;
}
