import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { hasAccess } from "@/lib/permissions";
import { getActivities } from "@/app/actions/activityActions";
import ActivitiesClient from "./ActivitiesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Activities | SRE Portal",
  description: "Manage organization activities.",
};

export default async function ActivitiesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Check RBAC
  if (!hasAccess(session.user, 'activities', 'read')) {
    redirect("/dashboard?error=unauthorized");
  }

  const activitiesRes = await getActivities();

  return (
    <ActivitiesClient 
      initialActivities={activitiesRes.data || []} 
      currentUser={session.user} 
    />
  );
}
