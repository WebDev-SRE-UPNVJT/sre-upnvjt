import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/permissions";
import { getModuleProgressMonitoringData } from "@/app/actions/moduleProgressActions";
import ModuleProgressClient from "./ModuleProgressClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Monitoring Progres Modul | SRE Portal",
  description: "Pantau kemajuan membaca modul pembelajaran PPT dari masing-masing anggota SRE.",
};

export default async function ModuleProgressPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const roleName = (session.user.roleName || "").toUpperCase();
  const canAccess =
    hasAccess(session.user, "module_progress", "read") ||
    hasAccess(session.user, "ppt", "read") ||
    roleName.includes("MENTOR") ||
    roleName.includes("ADMIN");

  if (!canAccess) {
    redirect("/dashboard?error=unauthorized");
  }

  const result = await getModuleProgressMonitoringData();

  if (!result.success) {
    return (
      <div className="p-8 text-center">
        <p className="text-rose-500 font-bold">Gagal memuat data progres modul: {result.error}</p>
      </div>
    );
  }

  return (
    <ModuleProgressClient
      initialData={result.data}
      currentUser={session.user}
    />
  );
}
