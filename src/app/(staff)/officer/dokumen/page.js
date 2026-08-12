import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { documentCategory, documentItem, user } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import DokumenClient from "./DokumenClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dokumen | SRE Portal",
  description: "Dokumen internal SRE.",
};

export default async function StaffDokumenPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Fetch categories
  const categories = await db.query.documentCategory.findMany({
    orderBy: [desc(documentCategory.createdAt)],
  });

  // Fetch documents with category and uploadedBy
  const documents = await db.query.documentItem.findMany({
    orderBy: [desc(documentItem.createdAt)],
    with: {
      category: true,
      uploadedBy: true,
    }
  });

  return (
    <DokumenClient 
      initialCategories={categories}
      initialDocuments={documents}
      user={session.user}
    />
  );
}
