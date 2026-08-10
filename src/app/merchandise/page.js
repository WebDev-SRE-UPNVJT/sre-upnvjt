import React from "react";
import { db } from "@/lib/db";
import { merchandise } from "@/db/schema";
import { desc } from "drizzle-orm";
import MerchPublicClient from "./MerchPublicClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Merchandise | SRE UPNVJT",
  description: "Official merchandise SRE UPN Veteran Jawa Timur.",
};

export default async function MerchandisePage() {
  const dbMerchandise = await db.query.merchandise.findMany({
    where: (m, { eq }) => eq(m.isAvailable, true),
    orderBy: [desc(merchandise.createdAt)]
  });

  const safeMerch = dbMerchandise.map(m => ({
    ...m,
    price: m.price ? m.price.toString() : "0"
  }));

  return <MerchPublicClient merchandise={safeMerch} />;
}
