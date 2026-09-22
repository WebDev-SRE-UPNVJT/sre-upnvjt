import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import ShortlinkClient from "./ShortlinkClient";
import { db } from "@/lib/db";
import { shortlink, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SRE Links | Staff SRE UPNVJT",
};

export default async function ShortlinkPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // Fetch initial shortlinks
  let initialLinks = [];
  try {
    const data = await db.select({
      id: shortlink.id,
      slug: shortlink.slug,
      originalUrl: shortlink.originalUrl,
      description: shortlink.description,
      clicks: shortlink.clicks,
      isActive: shortlink.isActive,
      createdAt: shortlink.createdAt,
      creatorName: user.name,
    })
    .from(shortlink)
    .leftJoin(user, eq(shortlink.createdById, user.id))
    .orderBy(desc(shortlink.createdAt));

    initialLinks = (data || []).map(link => ({
      ...link,
      clicks: Number(link.clicks) || 0,
      isActive: link.isActive !== undefined && link.isActive !== null ? Boolean(link.isActive) : true,
      createdAt: link.createdAt ? (link.createdAt instanceof Date ? link.createdAt.toISOString() : new Date(link.createdAt).toISOString()) : null,
    }));
  } catch (error) {
    console.error("Failed to fetch initial links:", error);
    initialLinks = [];
  }

  return <ShortlinkClient initialLinks={initialLinks} />;
}
