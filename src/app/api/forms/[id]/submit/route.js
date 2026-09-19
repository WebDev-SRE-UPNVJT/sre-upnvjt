import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formTemplate, formSubmission, task, taskSubmission, user, memberProfile, xpTransaction } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { appendFormResponseToSheet, appendOrUpdateTaskSubmissionToSheet } from '@/lib/googleSheets';
import { calculateSpeedBonusXp } from '@/lib/xpUtils';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    let form = await db.query.formTemplate.findFirst({
      where: eq(formTemplate.uuid, String(id)),
    });

    if (!form) {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        form = await db.query.formTemplate.findFirst({
          where: eq(formTemplate.id, numId),
        });
      }
    }

    if (!form) {
      return NextResponse.json({ error: 'Formulir tidak ditemukan' }, { status: 404 });
    }

    const formId = form.id;

    if (!form.isPublished) {
      return NextResponse.json({
        error: 'Formulir ini saat ini sedang tidak menerima tanggapan (Draft/Tutup).',
      }, { status: 403 });
    }

    // Cek session jika responden sedang login (hanya jalankan jika cookie auth ada)
    let memberId = null;
    let autoName = '';
    let autoEmail = '';
    let autoNpm = '';
    const hasSessionCookie = req.cookies.get('next-auth.session-token') || req.cookies.get('__Secure-next-auth.session-token');
    if (hasSessionCookie) {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
          memberId = parseInt(session.user.id, 10);
          autoName = session.user.name || '';
          autoEmail = session.user.email || '';
          
          // Ambil npm jika tersedia
          if (session.user.npm) {
            autoNpm = session.user.npm;
          } else {
            const u = await db.query.user.findFirst({
              where: eq(user.id, memberId),
              columns: { npm: true },
            });
            if (u?.npm) autoNpm = u.npm;
          }
        }
      } catch (e) {
        // Abaikan jika token kedaluwarsa / invalid
      }
    }

    const body = await req.json();
    const {
      responderName = autoName || '',
      responderEmail = autoEmail || '',
      userId = memberId || null,
      userName = autoName || '',
      userEmail = autoEmail || '',
      userNpm = autoNpm || '',
      answers = [],
    } = body;

    const finalMemberId = memberId || (userId ? parseInt(userId, 10) : null);
    const finalName = (responderName || userName || autoName || '').trim();
    const finalEmail = (responderEmail || userEmail || autoEmail || '').trim();
    const finalNpm = (userNpm || autoNpm || '').trim();

    // Cek pembatasan 1 tanggapan per akun jika opsi limitOneResponse aktif
    if (form.limitOneResponse) {
      let existingSub = null;
      if (finalMemberId) {
        existingSub = await db.query.formSubmission.findFirst({
          where: and(
            eq(formSubmission.formTemplateId, formId),
            eq(formSubmission.memberId, finalMemberId)
          ),
        });
      }
      if (!existingSub && finalEmail) {
        existingSub = await db.query.formSubmission.findFirst({
          where: and(
            eq(formSubmission.formTemplateId, formId),
            eq(formSubmission.responderEmail, finalEmail)
          ),
        });
      }

      if (existingSub) {
        return NextResponse.json({
          error: 'Anda sudah pernah mengirimkan tanggapan untuk formulir ini. Formulir ini dibatasi hanya 1 kali pengisian per akun.',
          alreadySubmitted: true,
          submissionId: existingSub.id,
          submittedAt: existingSub.submittedAt,
        }, { status: 400 });
      }
    }

    // Validasi pertanyaan wajib (Server-Side Validation) & Perhitungan Skor Kuis
    let earnedScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    let totalScoredQuestions = 0;

    if (Array.isArray(form.questions)) {
      for (const q of form.questions) {
        if (!q || q.type === 'page_break') continue;

        const submittedAnswer = (answers || []).find((a) => String(a.questionId) === String(q.id));
        const val = submittedAnswer?.value;

        // Validasi wajib
        if (Boolean(q.required)) {
          const isEmpty =
            val === undefined ||
            val === null ||
            (typeof val === 'string' && val.trim() === '') ||
            (Array.isArray(val) && val.length === 0);

          if (isEmpty) {
            return NextResponse.json(
              {
                error:
                  q.type === 'file'
                    ? `Berkas untuk "${q.question || 'soal'}" wajib diunggah.`
                    : `Pertanyaan "${q.question || 'soal'}" wajib diisi.`,
              },
              { status: 400 }
            );
          }
        }

        // Kalkulasi Skor jika mode Kuis aktif atau soal memiliki poin
        const qPoints = parseInt(q.points, 10) || 0;
        if (form.isQuiz || qPoints > 0) {
          if (qPoints > 0) {
            maxScore += qPoints;
            totalScoredQuestions += 1;
          }

          const hasKey = q.correctAnswer !== undefined && q.correctAnswer !== null && (Array.isArray(q.correctAnswer) ? q.correctAnswer.length > 0 : String(q.correctAnswer).trim() !== '');
          if (hasKey && val !== undefined && val !== null) {
            let isCorrect = false;

            if (q.type === 'radio' || q.type === 'dropdown') {
              isCorrect = String(val).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
            } else if (q.type === 'checkbox') {
              const userVals = (Array.isArray(val) ? val : [val]).map((s) => String(s).trim().toLowerCase()).sort();
              const keyVals = (Array.isArray(q.correctAnswer)
                ? q.correctAnswer
                : String(q.correctAnswer).split(/[,;\n|]+/)
              ).map((s) => String(s).trim().toLowerCase()).sort();

              isCorrect = userVals.length === keyVals.length && userVals.every((v, i) => v === keyVals[i]);
            } else if (q.type === 'text' || q.type === 'number') {
              isCorrect = String(val).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
            }

            if (isCorrect) {
              earnedScore += qPoints;
              correctCount += 1;
            }
          }
        }
      }
    }

    const percentage = maxScore > 0 ? Math.round((earnedScore / maxScore) * 100) : 0;
    const isQuizForm = Boolean(form.isQuiz) || maxScore > 0;

    // 1. Simpan ke database PostgreSQL (Form Response)
    const [inserted] = await db.insert(formSubmission).values({
      formTemplateId: formId,
      memberId: finalMemberId || null,
      responderName: finalName || null,
      responderEmail: finalEmail || null,
      answers: answers || [],
      score: isQuizForm ? earnedScore : null,
      submittedAt: new Date(),
    }).returning();

    // 2. Realtime Append ke Tab 2 ("Respon Form Detail") Google Spreadsheet (jika terhubung)
    if (form.spreadsheetId) {
      appendFormResponseToSheet(
        form.spreadsheetId,
        {
          timestamp: new Date(),
          answers,
          userId: finalMemberId,
          userName: finalName,
          userEmail: finalEmail,
          userNpm: finalNpm,
          responderName: finalName,
          responderEmail: finalEmail,
          score: isQuizForm ? earnedScore : null,
          maxScore: isQuizForm ? maxScore : null,
          scoreStr: isQuizForm ? `${earnedScore} / ${maxScore}` : '',
          scorePercentage: isQuizForm ? `${percentage}%` : '',
          correctCount: isQuizForm ? correctCount : null,
          correctSummary: isQuizForm ? `${correctCount} Benar / ${totalScoredQuestions || (form.questions || []).filter(q => q && q.type !== 'page_break').length} Soal` : '',
        },
        form.questions
      ).catch((sheetErr) => {
        console.error('[FormSubmit] Background Tab 2 Sheet sync error:', sheetErr);
      });
    }

    // 3. Jika responden adalah Member login & Formulir terhubung dengan Task / Quest
    let earnedTaskXp = 0;
    let earnedSpeedBonusXp = 0;
    let earnedBaseXp = 0;

    if (memberId) {
      try {
        const linkedTasks = await db.query.task.findMany({
          where: eq(task.formTemplateId, formId),
        });

        for (const lTask of linkedTasks) {
          // Lewati pemberian XP dan rekaman submisi tugas jika tugas sudah ditutup (overdue & allowLateSubmission === false)
          if (lTask.allowLateSubmission === false && lTask.deadline && new Date() > new Date(lTask.deadline)) {
            continue;
          }

          // Cari apakah sudah pernah submit tugas ini
          const existingTaskSub = await db.query.taskSubmission.findFirst({
            where: and(
              eq(taskSubmission.taskId, lTask.id),
              eq(taskSubmission.memberId, memberId)
            ),
          });

          // Hitung perolehan XP berdasarkan lTask.formScoringMode
          const scoringMode = lTask.formScoringMode || "COMPLETION";
          const maxRewardXp = lTask.rewardXp || 0;
          let baseTaskXp = 0;

          if (scoringMode === "COMPLETION") {
            // Flat (Penuh): Seluruh reward XP diberikan saat berhasil mengirim formulir
            baseTaskXp = maxRewardXp;
          } else if (scoringMode === "PROPORTIONAL") {
            // Sesuai Persentase Skor / Jawaban Benar
            if (isQuizForm && maxScore > 0) {
              baseTaskXp = Math.ceil((earnedScore / maxScore) * maxRewardXp);
            } else {
              baseTaskXp = maxRewardXp;
            }
          } else if (scoringMode === "PERFECT") {
            // 100% Sempurna (Perfect Score)
            if (isQuizForm && maxScore > 0) {
              baseTaskXp = (earnedScore === maxScore) ? maxRewardXp : 0;
            } else {
              baseTaskXp = maxRewardXp;
            }
          }

          // Hitung Bonus Kecepatan (Speed Bonus) jika diaktifkan di task
          const isSpeedBonusEnabled = lTask.enableSpeedBonus !== false;
          let speedBonusXp = 0;
          if (isSpeedBonusEnabled && (baseTaskXp > 0 || !isQuizForm)) {
            speedBonusXp = calculateSpeedBonusXp(
              lTask.createdAt,
              lTask.deadline,
              new Date()
            );
          }

          const totalTaskXpEarned = baseTaskXp + speedBonusXp;
          earnedTaskXp = Math.max(earnedTaskXp, totalTaskXpEarned);
          earnedSpeedBonusXp = Math.max(earnedSpeedBonusXp, speedBonusXp);
          earnedBaseXp = Math.max(earnedBaseXp, baseTaskXp);

          let taskSubRecord = existingTaskSub;
          const formResponseUrl = `/f/${form.uuid || form.id}`;
          const subStatus = "APPROVED"; // Otomatis disetujui karena formulir terverifikasi sistem
          let feedbackMsg = isQuizForm
            ? `Skor Kuis: ${earnedScore}/${maxScore} (${percentage}%) | XP Dasar: +${baseTaskXp} XP`
            : `Formulir berhasil diselesaikan | XP Dasar: +${baseTaskXp} XP`;

          if (speedBonusXp > 0) {
            feedbackMsg += ` | Bonus Kecepatan: +${speedBonusXp} XP`;
          }
          if (speedBonusXp > 0) {
            feedbackMsg += ` (Total: +${totalTaskXpEarned} XP)`;
          }

          // Cek apakah sebelumnya sudah pernah APPROVED (agar tidak double award XP)
          const wasAlreadyApproved = existingTaskSub?.status === "APPROVED";
          const previousXpEarned = existingTaskSub?.xpEarned || 0;

          if (!existingTaskSub) {
            const [createdSub] = await db.insert(taskSubmission).values({
              taskId: lTask.id,
              memberId: memberId,
              fileUrl: formResponseUrl,
              status: subStatus,
              score: isQuizForm ? percentage : 100,
              correctCount: isQuizForm ? correctCount : null,
              wrongCount: isQuizForm ? Math.max(0, (totalScoredQuestions || 0) - correctCount) : null,
              totalQuestions: isQuizForm ? (totalScoredQuestions || 0) : null,
              xpEarned: totalTaskXpEarned,
              feedback: feedbackMsg,
              submittedAt: new Date(),
            }).returning();
            taskSubRecord = createdSub;
          } else {
            const [updatedSub] = await db.update(taskSubmission)
              .set({
                fileUrl: formResponseUrl,
                status: subStatus,
                score: isQuizForm ? percentage : 100,
                correctCount: isQuizForm ? correctCount : null,
                wrongCount: isQuizForm ? Math.max(0, (totalScoredQuestions || 0) - correctCount) : null,
                totalQuestions: isQuizForm ? (totalScoredQuestions || 0) : null,
                xpEarned: totalTaskXpEarned,
                feedback: feedbackMsg,
                submittedAt: new Date(),
              })
              .where(eq(taskSubmission.id, existingTaskSub.id))
              .returning();
            taskSubRecord = updatedSub;
          }

          // Tambahkan XP ke Member Profile & Catat Transaksi XP
          const xpDiff = wasAlreadyApproved ? Math.max(0, totalTaskXpEarned - previousXpEarned) : totalTaskXpEarned;
          if (xpDiff > 0) {
            const profile = await db.query.memberProfile.findFirst({
              where: eq(memberProfile.userId, memberId),
            });

            if (!profile) {
              await db.insert(memberProfile).values({
                userId: memberId,
                xp: xpDiff,
                level: Math.floor(xpDiff / 100) + 1,
              });
            } else {
              const nextXp = profile.xp + xpDiff;
              const nextLevel = Math.floor(nextXp / 100) + 1;
              await db.update(memberProfile)
                .set({ xp: nextXp, level: nextLevel })
                .where(eq(memberProfile.userId, memberId));
            }

            const reasons = [
              `Penyelesaian Misi Formulir (${lTask.title}): +${baseTaskXp} XP (${scoringMode === "PROPORTIONAL" ? `Skor: ${percentage}%` : "Selesai"})`
            ];
            if (speedBonusXp > 0) {
              reasons.push(`Bonus Kecepatan: +${speedBonusXp} XP`);
            }

            await db.insert(xpTransaction).values({
              userId: memberId,
              amount: xpDiff,
              reason: reasons.join(" | "),
              sourceType: "task",
              sourceId: taskSubRecord.id,
            });
          }

          // Sinkronkan ke Tab 1 ("Submisi Tugas") Google Spreadsheet jika Task memiliki spreadsheet
          const targetSpreadsheetId = lTask.spreadsheetId || form.spreadsheetId;
          if (targetSpreadsheetId && taskSubRecord) {
            appendOrUpdateTaskSubmissionToSheet(targetSpreadsheetId, {
              id: taskSubRecord.id,
              memberId: memberId,
              memberName: responderName || autoName,
              memberEmail: responderEmail || autoEmail,
              status: subStatus,
              fileUrl: formResponseUrl,
              feedback: feedbackMsg,
              submittedAt: taskSubRecord.submittedAt || new Date(),
              taskDeadline: lTask.deadline,
            }).catch((taskSheetErr) => {
              console.error('[FormSubmit] Background Tab 1 Sheet sync error:', taskSheetErr);
            });
          }
        }
      } catch (taskLinkErr) {
        console.warn('[FormSubmit] Task submission link warning:', taskLinkErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      submissionId: inserted.id,
      message: form.successMessage || 'Tanggapan Anda telah berhasil direkam.',
      score: isQuizForm ? earnedScore : null,
      maxScore: isQuizForm ? maxScore : null,
      percentage: isQuizForm ? percentage : null,
      correctCount: isQuizForm ? correctCount : null,
      totalQuestions: isQuizForm ? totalScoredQuestions : null,
      isQuiz: isQuizForm,
      xpEarned: earnedTaskXp > 0 ? earnedTaskXp : null,
      baseXp: earnedBaseXp > 0 ? earnedBaseXp : null,
      speedBonusXp: earnedSpeedBonusXp > 0 ? earnedSpeedBonusXp : null,
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting form:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengirim tanggapan formulir' }, { status: 500 });
  }
}
