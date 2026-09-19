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

function parseBool(val, defaultVal = true) {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    const s = val.trim().toLowerCase();
    if (s === "false" || s === "0" || s === "off" || s === "no") return false;
    if (s === "true" || s === "1" || s === "on" || s === "yes") return true;
  }
  if (typeof val === "number") return val !== 0;
  return Boolean(val);
}

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
      },
      pptModule: {
        columns: { id: true, title: true, coverImageUrl: true }
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
    isRequired: parseBool(t.isRequired, true),
    deadline: t.deadline,
    folderId: t.folderId,
    spreadsheetId: t.spreadsheetId,
    spreadsheetUrl: t.spreadsheetUrl,
    maxUploadSizeMb: t.maxUploadSizeMb,
    allowMultipleFiles: parseBool(t.allowMultipleFiles, false),
    submissionType: t.submissionType,
    formTemplateId: t.formTemplateId,
    ttsCrosswordId: t.ttsCrosswordId,
    pptModuleId: t.pptModuleId,
    ttsScoringMode: t.ttsScoringMode || "COMPLETION",
    formScoringMode: t.formScoringMode || "COMPLETION",
    enableSpeedBonus: parseBool(t.enableSpeedBonus, true),
    allowLateSubmission: parseBool(t.allowLateSubmission, true),
    ttsCrossword: t.ttsCrossword,
    formTemplate: t.formTemplate,
    prerequisiteTaskId: t.prerequisiteTaskId,
    prerequisiteTask: t.prerequisiteTask,
    pptModule: t.pptModule,
    createdById: t.createdById,
    createdAt: t.createdAt,
    submissionCount: t.submissions?.length || 0,
  }));

  // Fetch available TTS Puzzles, Form Templates, and PPT Modules for task relation selection
  const availablePuzzles = await db.query.ttsCrossword.findMany({
    orderBy: (c, { desc }) => [desc(c.createdAt)],
    columns: { id: true, title: true, slug: true, rewardXp: true, isPublished: true },
  });

  const availableForms = await db.query.formTemplate.findMany({
    orderBy: (f, { desc }) => [desc(f.createdAt)],
    columns: { id: true, title: true, uuid: true, isPublished: true },
  });

  const availablePptModules = await db.query.pptModule.findMany({
    orderBy: (m, { desc }) => [desc(m.createdAt)],
    columns: { id: true, title: true, isPublished: true },
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
      availablePptModules={availablePptModules || []}
      currentUser={session.user}
    />
  );
}
