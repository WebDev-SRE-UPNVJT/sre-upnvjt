import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { memberApplication } from "@/db/schema";
import { desc } from "drizzle-orm";
import ApplicationsClient from "./ApplicationsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Member Applications Admin | SRE Portal",
  description: "Tinjau dan seleksi pendaftaran pengurus baru SRE UPNVJT.",
};

export default async function ApplicationsAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user, "applications", "read") && !hasAccess(session.user, "users", "read")) {
    redirect("/dashboard?error=unauthorized");
  }

  const data = await db.query.memberApplication.findMany({
    orderBy: [desc(memberApplication.appliedAt)],
  });

  return (
    <ApplicationsClient
      initialApplications={data}
      currentUser={session.user}
    />
  );
}
