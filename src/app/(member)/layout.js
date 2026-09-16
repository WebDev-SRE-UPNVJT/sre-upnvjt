import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { memberProfile, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import MemberNavbarClient from "./MemberNavbarClient";

export const dynamic = "force-dynamic";

export default async function MemberLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Load the member's profile for XP & Level
  let profile = await db.query.memberProfile.findFirst({
    where: eq(memberProfile.userId, parseInt(session.user.id)),
  });

  if (!profile) {
    // If somehow profile is missing, initialize it
    const [newProfile] = await db.insert(memberProfile).values({
      userId: parseInt(session.user.id),
      xp: 0,
      level: 1,
    }).returning();
    profile = newProfile;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07130e] text-slate-900 dark:text-white transition-colors duration-500 flex flex-col overflow-x-hidden">
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
