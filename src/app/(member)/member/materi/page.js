import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { pptModule, pptSlide, pptPhase, pptModuleProgress } from "@/db/schema";
import { eq, asc, count } from "drizzle-orm";
import MateriClient from "./MateriClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Materi PPT Pembelajaran | SRE Portal",
  description: "Akses materi pembelajaran dan modul slide presentasi SRE UPNVJT.",
};

export default async function MemberMateriPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userId = Number(session?.user?.id);

  // Fetch only published modules with slide count & phase
  const modules = await db
    .select({
      id: pptModule.id,
      phaseId: pptModule.phaseId,
      phaseName: pptPhase.name,
      phaseOrder: pptPhase.order,
      title: pptModule.title,
      description: pptModule.description,
      coverImageUrl: pptModule.coverImageUrl,
      isPublished: pptModule.isPublished,
      createdById: pptModule.createdById,
      createdAt: pptModule.createdAt,
      slideCount: count(pptSlide.id),
    })
    .from(pptModule)
    .leftJoin(pptSlide, eq(pptSlide.moduleId, pptModule.id))
    .leftJoin(pptPhase, eq(pptPhase.id, pptModule.phaseId))
    .where(eq(pptModule.isPublished, true))
    .groupBy(pptModule.id, pptPhase.id)
    .orderBy(pptModule.createdAt);

  const phases = await db.query.pptPhase.findMany({
    orderBy: [asc(pptPhase.order), asc(pptPhase.id)],
  });

  // Fetch user's actual progress from DB
  let initialProgressMap = {};
  if (userId) {
    const userProgressRecords = await db
      .select()
      .from(pptModuleProgress)
      .where(eq(pptModuleProgress.userId, userId));

    for (const p of userProgressRecords) {
      initialProgressMap[p.moduleId] = {
        currentSlideIdx: p.currentSlideIdx,
        maxSlideIdx: p.maxSlideIdx,
        isCompleted: p.isCompleted,
        lastAccessed: p.lastAccessedAt ? new Date(p.lastAccessedAt).getTime() : Date.now(),
      };
    }
  }

  return (
    <MateriClient 
      initialModules={modules} 
      initialPhases={phases || []} 
      initialProgressMap={initialProgressMap} 
    />
  );
}
