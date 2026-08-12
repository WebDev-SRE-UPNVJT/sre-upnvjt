import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { user, role, department, division } from "@/db/schema";
import { eq } from "drizzle-orm";
import ProfilStaffClient from "./ProfilStaffClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profil Staff | SRE Portal",
  description: "Kelola profil dan pengaturan akun staff Anda.",
};

export default async function StaffProfilPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userId = parseInt(session.user.id);

  // Fetch full user details with profile
  const [userInfo] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      npm: user.npm,
      positionName: user.positionName,
      profilePictureUrl: user.profilePictureUrl,
      roleName: role.name,
      departmentName: department.name,
      divisionName: division.name,
    })
    .from(user)
    .leftJoin(role, eq(user.roleId, role.id))
    .leftJoin(department, eq(user.departmentId, department.id))
    .leftJoin(division, eq(user.divisionId, division.id))
    .where(eq(user.id, userId))
    .limit(1);

  if (!userInfo) redirect("/login");

  return (
    <ProfilStaffClient
      user={userInfo}
    />
  );
}
