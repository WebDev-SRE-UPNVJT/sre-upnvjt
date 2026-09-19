import React from "react";
import { db } from "@/lib/db";
import { merchandise } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/permissions";
import MerchClient from "./MerchClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Merchandise | SRE Portal",
};

export default async function MerchandisePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasAccess(session.user, "merchandise", "read")) {
    redirect("/dashboard?error=unauthorized");
  }

  const dbMerchandise = await db.query.merchandise.findMany({
    orderBy: [desc(merchandise.createdAt)],
  });

  const safeMerch = dbMerchandise.map((m) => ({
    ...m,
    price: m.price ? m.price.toString() : "0",
  }));

  return <MerchClient initialMerchandise={safeMerch} />;
}
