import React from "react";
import { db } from "@/lib/db";
import { partner } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/permissions";
import PartnerClient from "./PartnerClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Our Partners | SRE Portal",
};

export default async function PartnersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasAccess(session.user, "partners", "read")) {
    redirect("/dashboard?error=unauthorized");
  }

  const partners = await db.query.partner.findMany({
    orderBy: [asc(partner.createdAt)],
  });

  return <PartnerClient initialPartners={partners} />;
}
