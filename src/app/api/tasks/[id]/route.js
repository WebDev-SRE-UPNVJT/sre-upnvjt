import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { task, taskSubmission } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const body = await req.json();
    const { title, description, rewardXp, deadline, folderId, submissionType, maxUploadSizeMb, allowMultipleFiles } = body;

    if (!title || !description || !deadline) {
      return NextResponse.json({ error: "Judul, deskripsi, dan tenggat waktu wajib diisi" }, { status: 400 });
    }

    const [updated] = await db.update(task)
      .set({
        title,
        description,
        rewardXp: rewardXp ? parseInt(rewardXp) : 0,
        deadline: new Date(deadline),
        folderId: folderId ? String(folderId).trim() : null,
        submissionType: submissionType || "BOTH",
        maxUploadSizeMb: maxUploadSizeMb ? parseInt(maxUploadSizeMb) : 10,
        allowMultipleFiles: Boolean(allowMultipleFiles),
      })
      .where(eq(task.id, id))
      .returning();

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    // Delete submissions first (FK constraint)
    await db.delete(taskSubmission).where(eq(taskSubmission.taskId, id));
    await db.delete(task).where(eq(task.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
