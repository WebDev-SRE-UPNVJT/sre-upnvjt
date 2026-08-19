import React from "react";
import MateriDetailClient from "./MateriDetailClient";
import { db } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { pptModule, pptSlide } from "@/db/schema";
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
  const id = resolvedParams?.id;
  const moduleId = Number(id);

  if (!moduleId || isNaN(moduleId)) {
    redirect("/member/materi");
  }

  // Fetch module data on the server side
  const moduleData = await db.query.pptModule.findFirst({
    where: eq(pptModule.id, moduleId),
  });

  if (!moduleData) {
    redirect("/member/materi");
  }

  // Fetch slides
  const slidesData = await db.query.pptSlide.findMany({
    where: eq(pptSlide.moduleId, moduleId),
    orderBy: [asc(pptSlide.order)],
  });

  const fullData = {
    ...moduleData,
    slides: slidesData || [],
  };

  const r2Url = process.env.R2_PUBLIC_URL || "";

  return <MateriDetailClient initialData={fullData} r2Url={r2Url} />;
}
