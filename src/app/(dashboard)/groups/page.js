import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/permissions";
import { getMentorGroups, getUsersForMentoring } from "@/app/actions/mentorGroupActions";
import GroupsClient from "./GroupsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kelompok & Mentoring | SRE Portal",
  description: "Manajemen kelompok mentoring, penugasan mentor, dan pembagian anggota.",
};

export default async function GroupsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasAccess(session.user, "groups", "read")) {
    redirect("/dashboard?error=unauthorized");
  }

  const [groupsRes, usersRes] = await Promise.all([
    getMentorGroups(),
    getUsersForMentoring(),
  ]);

  return (
    <GroupsClient
      initialGroups={groupsRes.data || []}
      allUsers={usersRes.data || []}
      currentUser={session.user}
    />
  );
}
