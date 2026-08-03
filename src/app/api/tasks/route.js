import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { task, taskSubmission } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
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

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, rewardXp, deadline, folderId, submissionType, maxUploadSizeMb, allowMultipleFiles } = body;

    if (!title || !description || !deadline) {
      return NextResponse.json({ error: "Judul, deskripsi, dan tenggat waktu wajib diisi" }, { status: 400 });
    }

    const [result] = await db.insert(task).values({
      title,
      description,
      rewardXp: rewardXp ? parseInt(rewardXp) : 0,
      deadline: new Date(deadline),
      folderId: folderId ? String(folderId).trim() : null,
      submissionType: submissionType || "BOTH",
      maxUploadSizeMb: maxUploadSizeMb ? parseInt(maxUploadSizeMb) : 10,
      allowMultipleFiles: Boolean(allowMultipleFiles),
      createdById: session.user.id,
    }).returning();

    return NextResponse.json({ success: true, task: { ...result, submissionCount: 0 } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
