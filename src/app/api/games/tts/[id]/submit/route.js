import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ttsCrossword, ttsQuestion, task, taskSubmission, memberProfile, xpTransaction, user } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function formatSeconds(sec) {
  if (!sec && sec !== 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Harap login terlebih dahulu" }, { status: 401 });
    }

    const resolvedParams = await params;
    const crosswordId = parseInt(resolvedParams.id);
    if (isNaN(crosswordId)) {
      return NextResponse.json({ error: "ID TTS tidak valid" }, { status: 400 });
    }

    const body = await req.json();
    const {
      userAnswers = {}, // { [questionId]: "ANSWER" } or answers array
      mistakeCount = 0,
      elapsedTime = 0,
      taskId = null,
    } = body;

    const parsedMistakes = Math.max(0, parseInt(mistakeCount) || 0);
    const memberId = parseInt(session.user.id);

    // 1. Fetch crossword & questions
    const crossword = await db.query.ttsCrossword.findFirst({
      where: eq(ttsCrossword.id, crosswordId),
      with: {
        questions: true,
      },
    });

    if (!crossword) {
      return NextResponse.json({ error: "TTS tidak ditemukan" }, { status: 404 });
    }

    const questions = crossword.questions || [];
    if (questions.length === 0) {
      return NextResponse.json({ error: "TTS ini belum memiliki pertanyaan" }, { status: 400 });
    }

    // 2. Evaluate answers
    let correctCount = 0;
    let wrongCount = 0;
    const detailedAnswers = [];

    questions.forEach((q) => {
      const cleanExpected = String(q.answer || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      const rawUserAns = userAnswers[q.id] || userAnswers[String(q.id)] || userAnswers[q.clue] || "";
      const cleanUserAns = String(rawUserAns).toUpperCase().replace(/[^A-Z0-9]/g, "");

      // If user answered with placeholder or revealed indicator, it's NOT correct
      const isCorrect =
        cleanUserAns !== "REVEALED_AFTER_WRONG" &&
        cleanUserAns !== "KUNCI_DIBUKA_KARENA_SALAH" &&
        cleanExpected.length > 0 &&
        cleanExpected === cleanUserAns;

      if (isCorrect) {
        correctCount += 1;
      } else {
        wrongCount += 1;
      }

      detailedAnswers.push({
        questionId: q.id,
        clue: q.clue,
        userAnswer: cleanUserAns === "REVEALED_AFTER_WRONG" ? "[Otomatis Terbuka / Keliru]" : (cleanUserAns || "-"),
        correctAnswer: cleanExpected,
        isCorrect,
      });
    });

    const totalQuestions = questions.length;
    const totalWrongAttempts = Math.max(wrongCount, parsedMistakes);
    // Score based on correct answers out of total questions
    const score = totalQuestions > 0 ? Math.max(0, Math.round((correctCount / totalQuestions) * 100)) : 0;

    // 3. Find linked task (if any)
    let linkedTask = null;
    if (taskId) {
      linkedTask = await db.query.task.findFirst({
        where: eq(task.id, parseInt(taskId)),
      });
    }

    if (!linkedTask) {
      linkedTask = await db.query.task.findFirst({
        where: eq(task.ttsCrosswordId, crosswordId),
        orderBy: [desc(task.createdAt)],
      });
    }

    let xpEarned = 0;
    let submissionRecord = null;

    if (linkedTask) {
      // 3b. Validasi Prasyarat Main Quest jika linkedTask adalah Side Quest terkunci
      if (linkedTask.prerequisiteTaskId) {
        const prereqSub = await db.query.taskSubmission.findFirst({
          where: and(
            eq(taskSubmission.taskId, linkedTask.prerequisiteTaskId),
            eq(taskSubmission.memberId, memberId),
            eq(taskSubmission.status, "APPROVED")
          ),
        });

        if (!prereqSub) {
          return NextResponse.json(
            { error: "Side Quest ini masih terkunci. Selesaikan Main Quest prasyarat terlebih dahulu." },
            { status: 403 }
          );
        }
      }

      // 4. Calculate XP based on Admin's configured ttsScoringMode
      const scoringMode = linkedTask.ttsScoringMode || "COMPLETION";
      const maxRewardXp = linkedTask.rewardXp || 0;

      if (scoringMode === "COMPLETION") {
        // Full XP upon completion regardless of mistakes (Flat XP)
        xpEarned = maxRewardXp;
      } else if (scoringMode === "PROPORTIONAL") {
        // Proportional XP based on ratio of correct answers, rounded up (Math.ceil)
        xpEarned = totalQuestions > 0 ? Math.ceil((correctCount / totalQuestions) * maxRewardXp) : 0;
      } else if (scoringMode === "PERFECT") {
        // Perfect score only (100% correct, 0 mistakes)
        xpEarned = (correctCount === totalQuestions && totalWrongAttempts === 0) ? maxRewardXp : 0;
      }

      const feedback = `Skor: ${score}% | Terpecahkan: ${correctCount}/${totalQuestions} | Kesalahan Input: ${totalWrongAttempts}x | Waktu: ${formatSeconds(elapsedTime)} | XP Diperoleh: +${xpEarned} XP`;
      const fileUrl = `[TTS Game] Skor: ${score}% (${correctCount}/${totalQuestions} Terpecahkan, ${totalWrongAttempts}x Keliru)`;

      // 5. Cek apakah sudah pernah mengerjakan (hanya 1x pengerjaan)
      const existingSubmission = await db.query.taskSubmission.findFirst({
        where: and(
          eq(taskSubmission.taskId, linkedTask.id),
          eq(taskSubmission.memberId, memberId)
        ),
      });

      if (existingSubmission) {
        return NextResponse.json(
          { error: "Penugasan TTS ini sudah pernah dikerjakan. Tugas hanya dapat diselesaikan 1 kali." },
          { status: 400 }
        );
      }

      const [insertedSub] = await db
        .insert(taskSubmission)
        .values({
          taskId: linkedTask.id,
          memberId: memberId,
          status: "APPROVED",
          score: score,
          correctCount: correctCount,
          wrongCount: totalWrongAttempts,
          totalQuestions: totalQuestions,
          xpEarned: xpEarned,
          timeTakenSeconds: elapsedTime,
          feedback: feedback,
          fileUrl: fileUrl,
          answers: detailedAnswers,
          submittedAt: new Date(),
        })
        .returning();

      submissionRecord = insertedSub;

      // 6. Tambahkan XP ke Member Profile jika ada perolehan XP
      if (xpEarned > 0) {
        const profile = await db.query.memberProfile.findFirst({
          where: eq(memberProfile.userId, memberId),
        });

        if (!profile) {
          await db.insert(memberProfile).values({
            userId: memberId,
            xp: xpEarned,
            level: Math.floor(xpEarned / 100) + 1,
          });
        } else {
          const nextXp = profile.xp + xpEarned;
          const nextLevel = Math.floor(nextXp / 100) + 1;
          await db
            .update(memberProfile)
            .set({ xp: nextXp, level: nextLevel })
            .where(eq(memberProfile.userId, memberId));
        }

        await db.insert(xpTransaction).values({
          userId: memberId,
          amount: xpEarned,
          reason: `Penyelesaian TTS: ${crossword.title} (${correctCount}/${totalQuestions} Terpecahkan, ${totalWrongAttempts}x Keliru - Skor ${score}%)`,
          sourceType: "task",
          sourceId: submissionRecord.id,
        });
      }

      // 7. Realtime sync to Google Spreadsheet if connected
      if (linkedTask.spreadsheetId) {
        try {
          const userRecord = await db.query.user.findFirst({
            where: eq(user.id, memberId),
            with: {
              department: true,
              division: true,
            },
          });

          const { appendOrUpdateTaskSubmissionToSheet } = await import("@/lib/googleSheets");
          appendOrUpdateTaskSubmissionToSheet(linkedTask.spreadsheetId, {
            id: submissionRecord.id,
            memberId: submissionRecord.memberId,
            memberName: userRecord?.name || session.user.name,
            memberEmail: userRecord?.email || session.user.email,
            departmentName: userRecord?.department?.name || "-",
            divisionName: userRecord?.division?.name || "-",
            status: submissionRecord.status,
            fileUrl: submissionRecord.fileUrl,
            feedback: submissionRecord.feedback,
            submittedAt: submissionRecord.submittedAt,
            taskDeadline: linkedTask.deadline,
          }).catch((sheetErr) => {
            console.warn("[TTS Submit] Background Google Sheet sync error:", sheetErr.message);
          });
        } catch (sheetSyncErr) {
          console.warn("[TTS Submit] Google Sheet sync exception:", sheetSyncErr.message);
        }
      }
    } else {
      // Standalone TTS game (without linked task)
      xpEarned = crossword.rewardXp || 10;
      if (score < 50) {
        xpEarned = Math.round(xpEarned * (score / 100));
      }

      if (xpEarned > 0) {
        const profile = await db.query.memberProfile.findFirst({
          where: eq(memberProfile.userId, memberId),
        });

        if (!profile) {
          await db.insert(memberProfile).values({
            userId: memberId,
            xp: xpEarned,
            level: Math.floor(xpEarned / 100) + 1,
          });
        } else {
          const nextXp = profile.xp + xpEarned;
          const nextLevel = Math.floor(nextXp / 100) + 1;
          await db
            .update(memberProfile)
            .set({ xp: nextXp, level: nextLevel })
            .where(eq(memberProfile.userId, memberId));
        }

        await db.insert(xpTransaction).values({
          userId: memberId,
          amount: xpEarned,
          reason: `Penyelesaian Game TTS: ${crossword.title} (${correctCount}/${totalQuestions} Benar)`,
          sourceType: "tts",
          sourceId: crossword.id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      score,
      correctCount,
      wrongCount: totalWrongAttempts,
      totalQuestions,
      xpEarned,
      elapsedTime,
      taskId: linkedTask?.id || null,
      taskTitle: linkedTask?.title || null,
      submissionId: submissionRecord?.id || null,
      detailedAnswers,
      message: "Jawaban TTS berhasil dinilai dan dicatat ke sistem!",
    });
  } catch (error) {
    console.error("Error submitting TTS answers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
