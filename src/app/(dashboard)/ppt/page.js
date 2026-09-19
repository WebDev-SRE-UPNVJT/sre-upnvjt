import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/permissions";
import { getPptModules, getPptPhases } from "@/app/actions/pptActions";
import PptClient from "./PptClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "PPT Modules | SRE Portal",
  description: "Kelola modul pembelajaran dan slide PPT SRE UPNVJT.",
};

export default async function PptPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user, "ppt", "read")) {
    redirect("/dashboard");
  }

  const [modulesRes, phasesRes] = await Promise.all([
    getPptModules(),
    getPptPhases(),
  ]);

  return (
    <PptClient
      initialModules={modulesRes.data || []}
      initialPhases={phasesRes.data || []}
      currentUser={session.user}
    />
  );
}
