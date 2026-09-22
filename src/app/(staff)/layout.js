import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import StaffNavbarClient from "./StaffNavbarClient";

export const dynamic = "force-dynamic";

export default async function StaffLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Optional: Add role protection to ensure only "Staff" or "Admin" can access
  // if (session.user.roleName !== "Staff" && session.user.roleName !== "Admin") {
  //   redirect("/");
  // }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07130e] text-slate-900 dark:text-white transition-colors duration-500 flex flex-col overflow-x-hidden">
      <StaffNavbarClient user={session.user} />
      <main className="flex-1 pt-28 pb-16 w-full px-6 sm:px-12 md:px-16 lg:px-24 max-w-[1600px] mx-auto">
        {children}
      </main>
    </div>
  );
}
