import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { literatureItem } from "@/db/schema";
import { eq } from "drizzle-orm";
import LiteraturDetailClient from "./LiteraturDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const item = await db.query.literatureItem.findFirst({
    where: eq(literatureItem.id, Number(id)),
  });

  if (!item) {
    return { title: "Not Found | SRE Portal" };
  }

  return {
    title: `${item.title} | Literatur SRE Portal`,
  };
}

export default async function LiteraturDetailPage({ params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const item = await db.query.literatureItem.findFirst({
    where: eq(literatureItem.id, Number(id)),
    with: {
      category: { columns: { id: true, name: true, imageUrl: true } },
    },
  });

  if (!item || !item.isPublished) {
    notFound();
  }

  return <LiteraturDetailClient item={item} />;
}
