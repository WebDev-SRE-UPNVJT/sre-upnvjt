import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getTTSById } from "@/app/actions/ttsActions";
import TTSParticipantPlayer from "../TTSParticipantPlayer";
import TTSStatusNotice from "../TTSStatusNotice";
import { db } from "@/lib/db";
import { task, taskSubmission, xpTransaction } from "@/db/schema";
import { and, eq, inArray, desc } from "drizzle-orm";

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

  const numericId = parseInt(id);
  if (isNaN(numericId)) {
    return (
      <TTSStatusNotice
        type="not_found"
        error="ID TTS tidak valid"
        taskId={taskId}
        backUrl="/member/tugas"
      />
    );
  }

  const res = await getTTSById(numericId);

  if (!res.success || !res.data) {
    return (
      <TTSStatusNotice
        type="not_found"
        error={res.error}
        taskId={taskId}
        backUrl="/member/tugas"
      />
    );
  }

  const memberId = parseInt(session.user.id);

  // 1. Cari task terkait jika taskId ada atau jika TTS ini ditautkan ke tabel Task
  let targetTaskId = taskId ? parseInt(taskId) : null;
  let linkedTaskRecord = null;

  if (targetTaskId && !isNaN(targetTaskId)) {
    linkedTaskRecord = await db.query.task.findFirst({
      where: eq(task.id, targetTaskId),
      with: {
        prerequisiteTask: { columns: { id: true, title: true } },
      },
    });
  } else {
    linkedTaskRecord = await db.query.task.findFirst({
      where: eq(task.ttsCrosswordId, numericId),
      with: {
        prerequisiteTask: { columns: { id: true, title: true } },
      },
      orderBy: [desc(task.createdAt)],
    });
    if (linkedTaskRecord) {
      targetTaskId = linkedTaskRecord.id;
    }
  }

  // 2. Cek apakah Side Quest ini terkunci karena Main Quest prasyarat belum APPROVED
  if (linkedTaskRecord?.prerequisiteTaskId && !isNaN(memberId)) {
    const prereqSub = await db.query.taskSubmission.findFirst({
      where: and(
        eq(taskSubmission.taskId, linkedTaskRecord.prerequisiteTaskId),
        eq(taskSubmission.memberId, memberId),
        eq(taskSubmission.status, "APPROVED")
      ),
    });

    if (!prereqSub) {
      return (
        <TTSStatusNotice
          type="locked"
          prerequisiteTaskTitle={linkedTaskRecord.prerequisiteTask?.title || ""}
          taskId={targetTaskId}
          backUrl="/member/tugas"
        />
      );
    }
  }

  // 3. CEK APAKAH MEMBER SUDAH PERNAH MENGERJAKAN TTS INI (TIDAK BOLEH AKSES LAGI JIKA SUDAH SELESAI)
  if (!isNaN(memberId)) {
    let existingSubmission = null;

    if (targetTaskId) {
      existingSubmission = await db.query.taskSubmission.findFirst({
        where: and(
          eq(taskSubmission.taskId, targetTaskId),
          eq(taskSubmission.memberId, memberId)
        ),
      });
    }

    // Periksa juga jika ada pengerjaan di task manapun yang menautkan crossword ini
    if (!existingSubmission) {
      const allTasksForTTS = await db.query.task.findMany({
        where: eq(task.ttsCrosswordId, numericId),
        columns: { id: true },
      });

      if (allTasksForTTS.length > 0) {
        const taskIds = allTasksForTTS.map((t) => t.id);
        existingSubmission = await db.query.taskSubmission.findFirst({
          where: and(
            inArray(taskSubmission.taskId, taskIds),
            eq(taskSubmission.memberId, memberId)
          ),
        });
      }
    }

    // Periksa juga di riwayat log XP pengerjaan TTS mandiri
    let existingXpLog = null;
    if (!existingSubmission) {
      existingXpLog = await db.query.xpTransaction.findFirst({
        where: and(
          eq(xpTransaction.userId, memberId),
          eq(xpTransaction.sourceType, "tts"),
          eq(xpTransaction.sourceId, numericId)
        ),
      });
    }

    // Jika member sudah pernah mengerjakan, tampilkan notifikasi tugas selesai + tombol bagikan (blokir pengerjaan ulang)
    if (existingSubmission || existingXpLog) {
      return (
        <TTSStatusNotice
          type="completed"
          ttsTitle={res.data.title}
          submission={
            existingSubmission || {
              score: 100,
              xpEarned: existingXpLog?.amount ?? res.data.rewardXp ?? 0,
            }
          }
          taskId={targetTaskId}
          backUrl="/member/tugas"
          puzzleData={res.data}
          currentUser={session.user}
        />
      );
    }

    // 4. Cek apakah batas waktu tugas sudah berakhir dan pengumpulan terlambat tidak diizinkan
    const isLateSubmissionBlocked =
      linkedTaskRecord?.allowLateSubmission === false &&
      linkedTaskRecord?.deadline &&
      new Date() > new Date(linkedTaskRecord.deadline);

    if (isLateSubmissionBlocked) {
      return (
        <TTSStatusNotice
          type="closed"
          ttsTitle={res.data.title}
          taskId={targetTaskId}
          backUrl="/member/tugas"
        />
      );
    }
  }

  return (
    <TTSParticipantPlayer
      puzzleData={res.data}
      onBackUrl="/member/tugas"
      currentUser={session.user}
      taskId={targetTaskId}
    />
  );
}
