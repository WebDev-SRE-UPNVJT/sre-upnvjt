import React from "react";
import MateriDetailClient from "./MateriDetailClient";
import { db } from "@/lib/db";
import { eq, asc, and } from "drizzle-orm";
import { pptModule, pptSlide, task, taskSubmission, pptModuleProgress } from "@/db/schema";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export default async function MateriDetailPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const paramKey = resolvedParams?.id || resolvedParams?.slug;

  if (!paramKey) {
    redirect("/member/materi");
  }

  // Fetch module data on the server side (check slug first, fallback to id)
  let moduleData = await db.query.pptModule.findFirst({
    where: eq(pptModule.slug, String(paramKey)),
    with: {
      phase: true,
    },
  });

  if (!moduleData && !isNaN(Number(paramKey))) {
    moduleData = await db.query.pptModule.findFirst({
      where: eq(pptModule.id, Number(paramKey)),
      with: {
        phase: true,
      },
    });
  }

  if (!moduleData) {
    redirect("/member/materi");
  }

  const moduleId = moduleData.id;

  // Fetch slides
  const slidesData = await db.query.pptSlide.findMany({
    where: eq(pptSlide.moduleId, moduleId),
    orderBy: [asc(pptSlide.order)],
  });

  // Fetch linked tasks for this module (Main Quest & Side Quest)
  const linkedTasks = await db.query.task.findMany({
    where: eq(task.pptModuleId, moduleId),
    orderBy: [asc(task.deadline)],
    with: {
      prerequisiteTask: {
        columns: { id: true, title: true }
      },
      ttsCrossword: {
        columns: { id: true, title: true }
      },
      formTemplate: {
        columns: { id: true, title: true }
      }
    }
  });

  // Fetch member's submissions for these tasks
  const memberSubmissions = await db.query.taskSubmission.findMany({
    where: eq(taskSubmission.memberId, parseInt(session.user.id)),
  });

  // Fetch member's progress for this module from DB
  const userProgress = await db.query.pptModuleProgress.findFirst({
    where: and(
      eq(pptModuleProgress.userId, parseInt(session.user.id)),
      eq(pptModuleProgress.moduleId, moduleId)
    ),
  });

  const fullData = {
    ...moduleData,
    slides: slidesData || [],
  };

  const r2Url = process.env.R2_PUBLIC_URL || "";

  return (
    <MateriDetailClient
      initialData={fullData}
      r2Url={r2Url}
      linkedTasks={linkedTasks || []}
      submissions={memberSubmissions || []}
      initialProgress={userProgress || null}
    />
  );
}
