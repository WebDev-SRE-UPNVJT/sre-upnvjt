import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  user,
  memberProfile,
  task,
  taskSubmission,
  attendance,
  pptModule,
  pptSlide,
  xpTransaction,
  pptPhase,
  pptModuleProgress,
} from "@/db/schema";
import { eq, desc, asc, and, sql } from "drizzle-orm";
import MemberDashboardClient from "./MemberDashboardClient";

export const dynamic = "force-dynamic";

export default async function MemberDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userIdInt = parseInt(session.user.id);
  if (isNaN(userIdInt)) {
    redirect("/login");
  }

  // Fetch all parallel queries concurrently in a single roundtrip batch
  const [
    currentUser,
    profileResult,
    higherRankResult,
    allTasks,
    submissions,
    presentAttendanceCount,
    allPublishedModules,
    allModuleProgress,
    allPhases,
    xpLogs,
  ] = await Promise.all([
    db.query.user.findFirst({
      where: eq(user.id, userIdInt),
      columns: {
        id: true,
        name: true,
        email: true,
        npm: true,
        profilePictureUrl: true,
      },
    }),
    db.query.memberProfile.findFirst({
      where: eq(memberProfile.userId, userIdInt),
      columns: {
        userId: true,
        xp: true,
        level: true,
      },
    }),
    db
      .select({
        count: sql`COUNT(*)::int`,
      })
      .from(memberProfile)
      .where(
        sql`${memberProfile.xp} > (SELECT COALESCE(xp, 0) FROM "memberProfile" WHERE "userId" = ${userIdInt})`
      ),
    db.query.task.findMany({
      orderBy: [asc(task.deadline)],
      columns: {
        id: true,
        title: true,
        rewardXp: true,
        category: true,
        prerequisiteTaskId: true,
        pptModuleId: true,
        deadline: true,
      },
    }),
    db.query.taskSubmission.findMany({
      where: eq(taskSubmission.memberId, userIdInt),
      columns: {
        id: true,
        taskId: true,
        status: true,
      },
    }),
    db
      .select({
        count: sql`COUNT(*)::int`,
      })
      .from(attendance)
      .where(
        and(
          eq(attendance.memberId, userIdInt),
          sql`${attendance.status} IN ('PRESENT', 'LATE')`
        )
      ),
    db
      .select({
        id: pptModule.id,
        title: pptModule.title,
        phaseId: pptModule.phaseId,
        createdAt: pptModule.createdAt,
        slideCount: sql`COUNT(${pptSlide.id})::int`,
      })
      .from(pptModule)
      .leftJoin(pptSlide, eq(pptSlide.moduleId, pptModule.id))
      .where(eq(pptModule.isPublished, true))
      .groupBy(pptModule.id)
      .orderBy(asc(pptModule.createdAt)),
    db.query.pptModuleProgress.findMany({
      where: eq(pptModuleProgress.userId, userIdInt),
      columns: {
        moduleId: true,
        currentSlideIdx: true,
        maxSlideIdx: true,
        isCompleted: true,
      },
    }),
    db.query.pptPhase.findMany({
      orderBy: [asc(pptPhase.order), asc(pptPhase.id)],
      columns: {
        id: true,
        name: true,
        description: true,
        order: true,
      },
    }),
    db.query.xpTransaction.findMany({
      where: eq(xpTransaction.userId, userIdInt),
      orderBy: [desc(xpTransaction.createdAt)],
      limit: 5,
      columns: {
        id: true,
        amount: true,
        reason: true,
        sourceType: true,
        createdAt: true,
      },
    }),
  ]);

  if (!currentUser) redirect("/login");

  let profile = profileResult;
  if (!profile) {
    try {
      await db.insert(memberProfile).values({
        userId: userIdInt,
        xp: 0,
        level: 1,
      }).onConflictDoNothing();
      profile = { userId: userIdInt, xp: 0, level: 1 };
    } catch {
      profile = { userId: userIdInt, xp: 0, level: 1 };
    }
  }

  const currentRank = (higherRankResult[0]?.count || 0) + 1;
  const completedTasksCount = submissions.filter((s) => s.status === "APPROVED").length;
  const presentCount = presentAttendanceCount[0]?.count || 0;
  const latestPpt = allPublishedModules[allPublishedModules.length - 1] || null;

  // Construct Phase Progress Hierarchy
  const phaseHierarchy = allPhases.map((phase) => {
    const phaseModules = allPublishedModules.filter((m) => m.phaseId === phase.id);
    let totalPhaseItems = 0;
    let completedPhaseItems = 0;

    const modulesWithTasks = phaseModules.map((mod) => {
      const userModProg = allModuleProgress.find((p) => p.moduleId === mod.id);
      const isModuleCompleted =
        !!userModProg?.isCompleted ||
        (mod.slideCount > 0 && (userModProg?.maxSlideIdx || 0) >= mod.slideCount - 1);

      totalPhaseItems += 1;
      if (isModuleCompleted) completedPhaseItems += 1;

      // Tasks linked to this module
      const modTasks = allTasks.filter((t) => t.pptModuleId === mod.id);
      const tasksWithSub = modTasks.map((t) => {
        const sub = submissions.find((s) => s.taskId === t.id);
        const isApproved = sub?.status === "APPROVED";
        const isLocked = t.prerequisiteTaskId
          ? !submissions.some((s) => s.taskId === t.prerequisiteTaskId && s.status === "APPROVED")
          : false;

        totalPhaseItems += 1;
        if (isApproved) completedPhaseItems += 1;

        return {
          id: t.id,
          title: t.title,
          rewardXp: t.rewardXp,
          category: t.category,
          prerequisiteTaskId: t.prerequisiteTaskId,
          isLocked,
          submission: sub || null,
          isApproved,
        };
      });

      // Sort tasks: Main Quest first
      tasksWithSub.sort((a, b) => {
        const isMainA =
          a.category === "MAIN" ||
          (!a.category && ((a.rewardXp || 0) >= 50 || (a.title || "").toLowerCase().includes("main")));
        const isMainB =
          b.category === "MAIN" ||
          (!b.category && ((b.rewardXp || 0) >= 50 || (b.title || "").toLowerCase().includes("main")));
        if (isMainA && !isMainB) return -1;
        if (!isMainA && isMainB) return 1;
        return 0;
      });

      return {
        id: mod.id,
        title: mod.title,
        slideCount: mod.slideCount || 0,
        isCompleted: isModuleCompleted,
        progressPct:
          mod.slideCount > 1
            ? Math.round(((userModProg?.currentSlideIdx || 0) / (mod.slideCount - 1)) * 100)
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
        (mod.slideCount > 0 && (userModProg?.maxSlideIdx || 0) >= mod.slideCount - 1);

      unphasedTotal += 1;
      if (isModuleCompleted) unphasedCompleted += 1;

      const modTasks = allTasks.filter((t) => t.pptModuleId === mod.id);
      const tasksWithSub = modTasks.map((t) => {
        const sub = submissions.find((s) => s.taskId === t.id);
        const isApproved = sub?.status === "APPROVED";
        const isLocked = t.prerequisiteTaskId
          ? !submissions.some((s) => s.taskId === t.prerequisiteTaskId && s.status === "APPROVED")
          : false;

        unphasedTotal += 1;
        if (isApproved) unphasedCompleted += 1;

        return {
          id: t.id,
          title: t.title,
          rewardXp: t.rewardXp,
          category: t.category,
          prerequisiteTaskId: t.prerequisiteTaskId,
          isLocked,
          submission: sub || null,
          isApproved,
        };
      });

      tasksWithSub.sort((a, b) => {
        const isMainA =
          a.category === "MAIN" ||
          (!a.category && ((a.rewardXp || 0) >= 50 || (a.title || "").toLowerCase().includes("main")));
        const isMainB =
          b.category === "MAIN" ||
          (!b.category && ((b.rewardXp || 0) >= 50 || (b.title || "").toLowerCase().includes("main")));
        if (isMainA && !isMainB) return -1;
        if (!isMainA && isMainB) return 1;
        return 0;
      });

      return {
        id: mod.id,
        title: mod.title,
        slideCount: mod.slideCount || 0,
        isCompleted: isModuleCompleted,
        progressPct:
          mod.slideCount > 1
            ? Math.round(((userModProg?.currentSlideIdx || 0) / (mod.slideCount - 1)) * 100)
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
      xpLogs={xpLogs}
      phaseHierarchy={phaseHierarchy}
    />
  );
}
