import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { memberProfile, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import MemberNavbarClient from "./MemberNavbarClient";
import ForceChangePasswordModal from "@/components/auth/ForceChangePasswordModal";

export const dynamic = "force-dynamic";

export default async function MemberLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const userIdInt = parseInt(session.user.id);
  if (isNaN(userIdInt)) {
    redirect("/login");
  }

  // Parallel load of mustChangePassword and profile with lean columns
  const [currentUser, memberProfileResult] = await Promise.all([
    db.query.user.findFirst({
      where: eq(user.id, userIdInt),
      columns: {
        mustChangePassword: true,
      },
    }),
    db.query.memberProfile.findFirst({
      where: eq(memberProfile.userId, userIdInt),
      columns: {
        userId: true,
        xp: true,
        level: true,
      },
    }),
  ]);

  const mustChangePassword = !!currentUser?.mustChangePassword;
  let profile = memberProfileResult;

  if (!profile) {
    // If somehow profile is missing, initialize it safely
    try {
      await db.insert(memberProfile).values({
        userId: userIdInt,
        xp: 0,
        level: 1,
      }).onConflictDoNothing();
      
      profile = await db.query.memberProfile.findFirst({
        where: eq(memberProfile.userId, userIdInt),
      }) || { userId: userIdInt, xp: 0, level: 1 };
    } catch (e) {
      profile = { userId: userIdInt, xp: 0, level: 1 };
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07130e] text-slate-900 dark:text-white transition-colors duration-500 flex flex-col overflow-x-hidden">
      {/* Forced Password Change Modal on First Login */}
      {mustChangePassword && (
        <ForceChangePasswordModal 
          mustChangePassword={mustChangePassword} 
          userEmail={session.user.email} 
        />
      )}

      <MemberNavbarClient
        user={session.user}
        profile={profile}
      />
      <main className="flex-1 pt-24 sm:pt-28 pb-16 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
