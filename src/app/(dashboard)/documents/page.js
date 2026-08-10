import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { documentCategory, documentItem } from "@/db/schema";
import { desc } from "drizzle-orm";
import DocumentsClient from "./DocumentsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dokumen Internal | SRE Portal",
  description: "Kelola dokumen internal dan arsip SRE UPNVJT.",
};

export default async function DocumentsPage() {
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
      uploadedBy: { columns: { id: true, name: true, email: true } },
    },
  });

  return (
    <DocumentsClient
      initialCategories={categories}
      initialDocuments={documents}
      currentUser={session.user}
    />
  );
}
