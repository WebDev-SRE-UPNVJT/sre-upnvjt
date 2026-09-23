import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import StaffNavbarClient from "./StaffNavbarClient";
import ForceChangePasswordModal from "@/components/auth/ForceChangePasswordModal";

export const dynamic = "force-dynamic";

export default async function StaffLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userIdInt = parseInt(session.user.id);

  // Load user data to check mustChangePassword status
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userIdInt),
  });

  const mustChangePassword = !!currentUser?.mustChangePassword;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07130e] text-slate-900 dark:text-white transition-colors duration-500 flex flex-col overflow-x-hidden">
      {/* Forced Password Change Modal on First Login */}
      {mustChangePassword && (
        <ForceChangePasswordModal 
          mustChangePassword={mustChangePassword} 
          userEmail={session.user.email} 
        />
      )}

      <StaffNavbarClient user={session.user} />
      <main className="flex-1 pt-28 pb-16 w-full px-6 sm:px-12 md:px-16 lg:px-24 max-w-[1600px] mx-auto">
        {children}
      </main>
    </div>
  );
}
