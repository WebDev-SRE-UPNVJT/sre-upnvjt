import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { shortlink, user, department } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import ShortlinksAdminClient from "./ShortlinksAdminClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Monitoring SRE Links | SRE Portal",
  description: "Monitor, kelola, dan tangguhkan seluruh shortlink resmi SRE UPNVJT.",
};

export default async function AdminShortlinksPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  
  if (!hasAccess(session.user, "shortlinks", "read")) {
    redirect("/dashboard");
  }

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
      creatorEmail: user.email,
      departmentName: department.name,
    })
    .from(shortlink)
    .leftJoin(user, eq(shortlink.createdById, user.id))
    .leftJoin(department, eq(user.departmentId, department.id))
    .orderBy(desc(shortlink.createdAt));

    initialLinks = data.map(link => ({
      ...link,
      isActive: link.isActive !== undefined && link.isActive !== null ? link.isActive : true,
      createdAt: link.createdAt ? link.createdAt.toISOString() : null,
    }));
  } catch (error) {
    console.error("Failed to fetch shortlinks for admin:", error);
  }

  return (
    <ShortlinksAdminClient
      initialLinks={initialLinks}
      currentUser={session.user}
    />
  );
}
