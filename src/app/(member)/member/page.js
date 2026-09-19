import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { user, memberProfile, task, taskSubmission, attendance, pptModule, literatureItem, xpTransaction, division, pptPhase, pptModuleProgress } from "@/db/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import MemberDashboardClient from "./MemberDashboardClient";
import { getAugmentedLeaderboard } from "@/lib/dummyLeaderboard";

export const dynamic = "force-dynamic";

export default async function MemberDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userIdInt = parseInt(session.user.id);

  // Fetch current user and profile
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userIdInt),
    with: {
      role: true,
      department: true,
    }
  });

  if (!currentUser) redirect("/login");

  let profile = await db.query.memberProfile.findFirst({
    where: eq(memberProfile.userId, userIdInt),
  });

  if (!profile) {
    const [newProfile] = await db.insert(memberProfile).values({
      userId: userIdInt,
      xp: 0,
      level: 1,
    }).returning();
    profile = newProfile;
  }

  // Fetch leaderboard to calculate rank
  const dbProfiles = await db
    .select({
      id: user.id,
      name: user.name,
      npm: user.npm,
      profilePictureUrl: user.profilePictureUrl,
      xp: memberProfile.xp,
      level: memberProfile.level,
      divisionName: division.name,
    })
    .from(memberProfile)
    .innerJoin(user, eq(user.id, memberProfile.userId))
    .leftJoin(division, eq(division.id, user.divisionId))
    .orderBy(desc(memberProfile.xp));

  const augmented = getAugmentedLeaderboard(dbProfiles);
  const userRankObj = augmented.find(item => item.id === userIdInt);
  const currentRank = userRankObj ? userRankObj.rank : augmented.length;

  // Fetch tasks and user's submissions
  const allTasks = await db.query.task.findMany({
    orderBy: [asc(task.deadline)],
  });

  const submissions = await db.query.taskSubmission.findMany({
    where: eq(taskSubmission.memberId, userIdInt),
  });

  // Calculate completed tasks
  const completedTasksCount = submissions.filter(s => s.status === "APPROVED").length;

  // Calculate attendance logs and streak
  const attendanceLogs = await db.query.attendance.findMany({
    where: eq(attendance.memberId, userIdInt),
    orderBy: [desc(attendance.createdAt)],
  });

  const presentCount = attendanceLogs.filter(a => a.status === "PRESENT" || a.status === "LATE").length;

  // Fetch all published modules with slides
  const allPublishedModules = await db.query.pptModule.findMany({
    where: eq(pptModule.isPublished, true),
    orderBy: [asc(pptModule.createdAt)],
    with: {
      slides: true,
    },
  });

  // Latest PPT module for banner
  const latestPpt = allPublishedModules[allPublishedModules.length - 1] || null;

  // Fetch user's module progresses from DB
  const allModuleProgress = await db.query.pptModuleProgress.findMany({
    where: eq(pptModuleProgress.userId, userIdInt),
  });

  // Fetch all Phases
  const allPhases = await db.query.pptPhase.findMany({
    orderBy: [asc(pptPhase.order), asc(pptPhase.id)],
  });

  // Construct Phase Progress Hierarchy
  const phaseHierarchy = allPhases.map((phase) => {
    const phaseModules = allPublishedModules.filter((m) => m.phaseId === phase.id);
    let totalPhaseItems = 0;
    let completedPhaseItems = 0;

    const modulesWithTasks = phaseModules.map((mod) => {
      const userModProg = allModuleProgress.find((p) => p.moduleId === mod.id);
      const isModuleCompleted =
        !!userModProg?.isCompleted ||
        (mod.slides?.length > 0 && (userModProg?.maxSlideIdx || 0) >= mod.slides.length - 1);

      totalPhaseItems += 1;
      if (isModuleCompleted) completedPhaseItems += 1;

      // Tasks linked to this module
      const modTasks = allTasks.filter((t) => t.pptModuleId === mod.id);
      const tasksWithSub = modTasks.map((t) => {
        const sub = submissions.find((s) => s.taskId === t.id);
        const isApproved = sub?.status === "APPROVED";

        totalPhaseItems += 1;
        if (isApproved) completedPhaseItems += 1;

        return {
          id: t.id,
          title: t.title,
          rewardXp: t.rewardXp,
          category: t.category,
          submission: sub || null,
          isApproved,
        };
      });

      return {
        id: mod.id,
        title: mod.title,
        slideCount: mod.slides?.length || 0,
        isCompleted: isModuleCompleted,
        progressPct:
          mod.slides?.length > 1
            ? Math.round(((userModProg?.currentSlideIdx || 0) / (mod.slides.length - 1)) * 100)
            : isModuleCompleted
            ? 100
            : 0,
        tasks: tasksWithSub,
      };
    });

    const progressPct =
      totalPhaseItems > 0 ? Math.round((completedPhaseItems / totalPhaseItems) * 100) : 0;

    return {
      id: phase.id,
      name: phase.name,
      description: phase.description,
      order: phase.order,
      modules: modulesWithTasks,
      totalItems: totalPhaseItems,
      completedItems: completedPhaseItems,
      progressPct,
    };
  });

  // If there are unphased modules, add them
  const unphasedModules = allPublishedModules.filter((m) => !m.phaseId);
  if (unphasedModules.length > 0) {
    let unphasedTotal = 0;
    let unphasedCompleted = 0;

    const modulesWithTasks = unphasedModules.map((mod) => {
      const userModProg = allModuleProgress.find((p) => p.moduleId === mod.id);
      const isModuleCompleted =
        !!userModProg?.isCompleted ||
        (mod.slides?.length > 0 && (userModProg?.maxSlideIdx || 0) >= mod.slides.length - 1);

      unphasedTotal += 1;
      if (isModuleCompleted) unphasedCompleted += 1;

      const modTasks = allTasks.filter((t) => t.pptModuleId === mod.id);
      const tasksWithSub = modTasks.map((t) => {
        const sub = submissions.find((s) => s.taskId === t.id);
        const isApproved = sub?.status === "APPROVED";

        unphasedTotal += 1;
        if (isApproved) unphasedCompleted += 1;

        return {
          id: t.id,
          title: t.title,
          rewardXp: t.rewardXp,
          category: t.category,
          submission: sub || null,
          isApproved,
        };
      });

      return {
        id: mod.id,
        title: mod.title,
        slideCount: mod.slides?.length || 0,
        isCompleted: isModuleCompleted,
        progressPct:
          mod.slides?.length > 1
            ? Math.round(((userModProg?.currentSlideIdx || 0) / (mod.slides.length - 1)) * 100)
            : isModuleCompleted
            ? 100
            : 0,
        tasks: tasksWithSub,
      };
    });

    phaseHierarchy.push({
      id: "unphased",
      name: "Modul Tambahan / Umum",
      description: "Materi dan quest pelengkap",
      order: 999,
      modules: modulesWithTasks,
      totalItems: unphasedTotal,
      completedItems: unphasedCompleted,
      progressPct: unphasedTotal > 0 ? Math.round((unphasedCompleted / unphasedTotal) * 100) : 0,
    });
  }

  // Fetch latest literature item
  const latestLiterature = await db.query.literatureItem.findFirst({
    where: eq(literatureItem.isPublished, true),
    orderBy: [desc(literatureItem.createdAt)],
    with: {
      category: true,
    },
  });

  // Fetch recent XP transactions
  const xpLogs = await db.query.xpTransaction.findMany({
    where: eq(xpTransaction.userId, userIdInt),
    orderBy: [desc(xpTransaction.createdAt)],
    limit: 5,
  });

  return (
    <MemberDashboardClient
      user={currentUser}
      profile={profile}
      rank={currentRank}
      tasks={allTasks.slice(0, 6)}
      submissions={submissions}
      completedTasksCount={completedTasksCount}
      presentCount={presentCount}
      latestPpt={latestPpt}
      latestLiterature={latestLiterature}
      xpLogs={xpLogs}
      phaseHierarchy={phaseHierarchy}
    />
  );
}
