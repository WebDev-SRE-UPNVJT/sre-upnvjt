import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/permissions";
import { getSubmissionsForReview } from "@/app/actions/submissionActions";
import SubmissionsClient from "./SubmissionsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Penilaian & Submisi Tugas | SRE Portal",
  description: "Tinjau, evaluasi hasil pengerjaan tugas member, dan berikan nilai / XP.",
};

export default async function SubmissionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const roleName = (session.user.roleName || "").toUpperCase();
  const canAccess =
    hasAccess(session.user, "submissions", "read") ||
    hasAccess(session.user, "tasks", "read") ||
    roleName.includes("MENTOR");

  if (!canAccess) {
    redirect("/dashboard?error=unauthorized");
  }

  const result = await getSubmissionsForReview();

  if (!result.success) {
    return (
      <div className="p-8 text-center">
        <p className="text-rose-500 font-bold">Gagal memuat data submisi: {result.error}</p>
      </div>
    );
  }

  return (
    <SubmissionsClient
      initialData={result.data}
      currentUser={session.user}
    />
  );
}
