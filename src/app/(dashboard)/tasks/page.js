import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { task, taskSubmission } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import TasksClient from "./TasksClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Task Management | SRE Portal",
  description: "Kelola penugasan dan hasil pengerjaan anggota SRE UPNVJT.",
};

export default async function TasksAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user, "tasks", "read")) {
    redirect("/dashboard");
  }

  // Fetch tasks with submission counts cleanly without SQL GROUP BY errors
  const rawTasks = await db.query.task.findMany({
    orderBy: [asc(task.deadline)],
    with: {
      submissions: {
        columns: { id: true }
      }
    }
  });

  const tasks = rawTasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    rewardXp: t.rewardXp,
    deadline: t.deadline,
    folderId: t.folderId,
    maxUploadSizeMb: t.maxUploadSizeMb,
    allowMultipleFiles: t.allowMultipleFiles,
    submissionType: t.submissionType,
    createdById: t.createdById,
    createdAt: t.createdAt,
    submissionCount: t.submissions?.length || 0,
  }));

  // Fetch all submissions
  const rawSubmissions = await db.query.taskSubmission.findMany({
    with: {
      member: { columns: { id: true, name: true } },
      task: { columns: { id: true, title: true, rewardXp: true } },
    },
    orderBy: [desc(taskSubmission.submittedAt)],
  });

  const subIds = rawSubmissions.map(s => s.id);
  let txMap = new Map();

  if (subIds.length > 0) {
    const transactions = await db.query.xpTransaction.findMany({
      where: (tx, { inArray }) => inArray(tx.sourceId, subIds),
    });
    transactions.forEach(tx => {
      if (tx.sourceType === "task" || tx.sourceType === "task_import") {
        txMap.set(tx.sourceId, tx);
      }
    });
  }

  const submissions = rawSubmissions.map(s => {
    const tx = txMap.get(s.id);
    let bonusXp = 0;
    if (tx) {
      const match = (tx.reason || "").match(/Bonus XP: \+(\d+) XP/);
      if (match) {
        bonusXp = parseInt(match[1]);
      } else if (tx.amount > (s.task?.rewardXp || 0)) {
        bonusXp = tx.amount - (s.task?.rewardXp || 0);
      }
    }
    return {
      ...s,
      bonusXp,
    };
  });

  return (
    <TasksClient
      initialTasks={tasks}
      initialSubmissions={submissions}
      currentUser={session.user}
    />
  );
}
