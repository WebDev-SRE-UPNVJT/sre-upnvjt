import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getTTSById } from "@/app/actions/ttsActions";
import TTSParticipantPlayer from "../TTSParticipantPlayer";
import TTSStatusNotice from "../TTSStatusNotice";
import { db } from "@/lib/db";
import { task, taskSubmission } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const res = await getTTSById(id);

  if (res.success && res.data) {
    return {
      title: `${res.data.title} | Penugasan TTS SRE UPNVJT`,
      description: res.data.description || "Kerjakan teka-teki silang interaktif SRE UPNVJT.",
    };
  }

  return {
    title: "Penugasan TTS | SRE UPNVJT",
    description: "Kerjakan teka-teki silang interaktif.",
  };
}

export default async function TTSAssignmentPlayPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const id = resolvedParams?.id;
  const taskId = resolvedSearchParams?.taskId;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    const callbackUrl = taskId ? `/games/tts/${id}?taskId=${taskId}` : `/games/tts/${id}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const res = await getTTSById(id);

  if (!res.success || !res.data) {
    return (
      <TTSStatusNotice
        type="not_found"
        error={res.error}
        taskId={taskId}
        backUrl={taskId ? "/member/tugas" : "/games/tts"}
      />
    );
  }

  // Jika terhubung dengan Task, cek apakah tugas terkunci atau sudah pernah dikerjakan
  if (taskId && session?.user?.id) {
    const taskRecord = await db.query.task.findFirst({
      where: eq(task.id, parseInt(taskId)),
      with: {
        prerequisiteTask: { columns: { id: true, title: true } }
      }
    });

    // 1. Cek apakah Side Quest ini terkunci karena Main Quest prasyarat belum APPROVED
    if (taskRecord?.prerequisiteTaskId) {
      const prereqSub = await db.query.taskSubmission.findFirst({
        where: and(
          eq(taskSubmission.taskId, taskRecord.prerequisiteTaskId),
          eq(taskSubmission.memberId, parseInt(session.user.id)),
          eq(taskSubmission.status, "APPROVED")
        ),
      });

      if (!prereqSub) {
        return (
          <TTSStatusNotice
            type="locked"
            prerequisiteTaskTitle={taskRecord.prerequisiteTask?.title || ""}
            taskId={taskId}
            backUrl="/member/tugas"
          />
        );
      }
    }

    // 2. Cek apakah sudah pernah mengerjakan (1x pengerjaan)
    const existingSubmission = await db.query.taskSubmission.findFirst({
      where: and(
        eq(taskSubmission.taskId, parseInt(taskId)),
        eq(taskSubmission.memberId, parseInt(session.user.id))
      ),
    });

    if (existingSubmission) {
      return (
        <TTSStatusNotice
          type="completed"
          ttsTitle={res.data.title}
          submission={existingSubmission}
          taskId={taskId}
          backUrl="/member/tugas"
        />
      );
    }
  }

  return (
    <TTSParticipantPlayer
      puzzleData={res.data}
      onBackUrl={taskId ? "/member/tugas" : "/games/tts"}
      currentUser={session.user}
      taskId={taskId}
    />
  );
}
