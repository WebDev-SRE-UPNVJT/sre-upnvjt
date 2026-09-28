import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { memberProfile, xpTransaction, taskSubmission, task, pptModule, pptModuleProgress, quizSubmission } from "@/db/schema";
import { eq, desc, and, or } from "drizzle-orm";
import AchievementClient from "./AchievementClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Achievement | SRE Portal",
  description: "Pantau pencapaian, badge, dan riwayat XP kamu di SRE UPNVJT.",
};

export default async function AchievementPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = parseInt(session.user.id);

  let profile = null;
  let xpLogs = [];
  let taskSubs = [];
  let moduleProgress = [];
  let publishedModules = [];
  let allTasks = [];
  let quizSubs = [];

  try {
    const results = await Promise.all([
      db.query.memberProfile.findFirst({ where: eq(memberProfile.userId, userId) }),
      db.query.xpTransaction.findMany({
        where: eq(xpTransaction.userId, userId),
        orderBy: [desc(xpTransaction.createdAt)],
      }),
      db.query.taskSubmission.findMany({
        where: and(
          eq(taskSubmission.memberId, userId),
          or(eq(taskSubmission.status, "APPROVED"), eq(taskSubmission.status, "approved"))
        ),
        with: { task: { columns: { id: true, title: true, rewardXp: true, category: true } } },
      }),
      db.query.pptModuleProgress.findMany({
        where: eq(pptModuleProgress.userId, userId),
        with: { module: { columns: { id: true, title: true, isPublished: true } } },
      }),
      db.query.pptModule.findMany({
        where: eq(pptModule.isPublished, true),
        columns: { id: true, title: true },
      }),
      db.query.task.findMany({
        columns: { id: true, title: true, category: true, isRequired: true },
      }),
      db.query.quizSubmission.findMany({
        where: and(eq(quizSubmission.memberId, userId), eq(quizSubmission.isPassed, true)),
        with: { quiz: { columns: { title: true, rewardXp: true } } },
      }),
    ]);

    profile = results[0];
    xpLogs = results[1] || [];
    taskSubs = results[2] || [];
    moduleProgress = results[3] || [];
    publishedModules = results[4] || [];
    allTasks = results[5] || [];
    quizSubs = results[6] || [];
  } catch (err) {
    console.error("Warning: DB query error in AchievementPage:", err.message);
  }

  return (
    <AchievementClient
      profile={profile}
      xpLogs={xpLogs}
      taskSubs={taskSubs}
      moduleProgress={moduleProgress}
      publishedModules={publishedModules}
      allTasks={allTasks}
      quizSubs={quizSubs}
    />
  );
}
