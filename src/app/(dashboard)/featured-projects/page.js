import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getFeaturedProjects } from "@/app/actions/featuredProjectActions";
import FeaturedProjectsClient from "./FeaturedProjectsClient";

export const metadata = {
  title: "Featured Projects | SRE Portal",
  description: "Manage featured projects displayed on the public home page.",
};

export default async function FeaturedProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  if (session.user.roleName !== "SUPER_ADMIN" && session.user.roleName !== "ADMIN") {
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
