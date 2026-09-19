import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { hasAccess } from "@/lib/permissions";
import { getFeaturedProjects } from "@/app/actions/featuredProjectActions";
import FeaturedProjectsClient from "./FeaturedProjectsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Featured Projects | SRE Portal",
  description: "Manage featured projects displayed on the public home page.",
};

export default async function FeaturedProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");

  if (!hasAccess(session.user, "featured-projects", "read")) {
    redirect("/dashboard?error=unauthorized");
  }

  const res = await getFeaturedProjects();

  return (
    <FeaturedProjectsClient
      initialProjects={res.data || []}
      currentUser={session.user}
    />
  );
}
