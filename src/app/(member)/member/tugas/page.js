import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { task, taskSubmission } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import TugasClient from "./TugasClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quest & Misi | SRE Portal",
  description: "Daftar Main Quest dan Side Quest untuk pengurus dan anggota SRE UPNVJT.",
};

export default async function MemberTugasPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Fetch all tasks with prerequisite relations
  const tasks = await db.query.task.findMany({
    orderBy: [asc(task.deadline)],
    with: {
      formTemplate: {
        columns: { id: true, uuid: true, title: true }
      },
      ttsCrossword: {
        columns: { id: true, title: true, slug: true, timeLimitMinutes: true, rewardXp: true }
      },
      prerequisiteTask: {
        columns: { id: true, title: true, rewardXp: true }
      }
    }
  });

  // Fetch only this member's submissions
  const submissions = await db.query.taskSubmission.findMany({
    where: eq(taskSubmission.memberId, parseInt(session.user.id)),
  });

  return (
    <TugasClient
      user={session.user}
      initialTasks={tasks}
      initialSubmissions={submissions}
    />
  );
}
