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

  // Fetch tasks with relations
  const rawTasks = await db.query.task.findMany({
    orderBy: [asc(task.deadline)],
    with: {
      submissions: {
        columns: { id: true }
      },
      ttsCrossword: {
        columns: { id: true, title: true, slug: true, timeLimitMinutes: true, rewardXp: true }
      },
      formTemplate: {
        columns: { id: true, uuid: true, title: true }
      },
      prerequisiteTask: {
        columns: { id: true, title: true }
      }
    }
  });

  const tasks = rawTasks.map(t => ({
    id: t.id,
    title: t.title,
    introduction: t.introduction || "",
    instructions: t.instructions || "",
    submissionGuidelines: t.submissionGuidelines || "",
    rewardXp: t.rewardXp,
    category: t.category || "MAIN",
    isRequired: t.isRequired ?? true,
    deadline: t.deadline,
    folderId: t.folderId,
    spreadsheetId: t.spreadsheetId,
    spreadsheetUrl: t.spreadsheetUrl,
    maxUploadSizeMb: t.maxUploadSizeMb,
    allowMultipleFiles: t.allowMultipleFiles,
    submissionType: t.submissionType,
    formTemplateId: t.formTemplateId,
    ttsCrosswordId: t.ttsCrosswordId,
    ttsCrossword: t.ttsCrossword,
    formTemplate: t.formTemplate,
    prerequisiteTaskId: t.prerequisiteTaskId,
    prerequisiteTask: t.prerequisiteTask,
    createdById: t.createdById,
    createdAt: t.createdAt,
    submissionCount: t.submissions?.length || 0,
  }));

  // Fetch available TTS Puzzles and Form Templates for task relation selection
  const availablePuzzles = await db.query.ttsCrossword.findMany({
    orderBy: (c, { desc }) => [desc(c.createdAt)],
    columns: { id: true, title: true, slug: true, rewardXp: true, isPublished: true },
  });

  const availableForms = await db.query.formTemplate.findMany({
    orderBy: (f, { desc }) => [desc(f.createdAt)],
    columns: { id: true, title: true, uuid: true, isPublished: true },
  });

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
      availablePuzzles={availablePuzzles || []}
      availableForms={availableForms || []}
      currentUser={session.user}
    />
  );
}
