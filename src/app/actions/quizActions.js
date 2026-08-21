"use server";

import { db } from "@/lib/db";
import { quiz, quizQuestion, quizSubmission } from "@/db/schema";
import { desc, asc, eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getQuizzes() {
  try {
    const data = await db
      .select({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        timeLimitMinutes: quiz.timeLimitMinutes,
        passingScore: quiz.passingScore,
        rewardXp: quiz.rewardXp,
        isPublished: quiz.isPublished,
        createdById: quiz.createdById,
        createdAt: quiz.createdAt,
        questionCount: count(quizQuestion.id),
      })
      .from(quiz)
      .leftJoin(quizQuestion, eq(quizQuestion.quizId, quiz.id))
      .groupBy(quiz.id)
      .orderBy(desc(quiz.createdAt));

    return { success: true, data };
  } catch (error) {
    console.error("Error getQuizzes:", error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function getQuiz(id) {
  try {
    const data = await db.query.quiz.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      with: {
        questions: { orderBy: [asc(quizQuestion.order)] },
      },
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error getQuiz:", error);
    return { success: false, error: error.message, data: null };
  }
}

export async function getQuizSubmissions() {
  try {
    const data = await db.query.quizSubmission.findMany({
      with: {
        member: { columns: { id: true, name: true } },
        quiz: {
          columns: { id: true, title: true, passingScore: true, rewardXp: true },
          with: {
            questions: { orderBy: [asc(quizQuestion.order)] }
          }
        },
        gradedBy: { columns: { id: true, name: true } },
      },
      orderBy: [desc(quizSubmission.submittedAt)],
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error getQuizSubmissions:", error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function createQuiz(data) {
  try {
    const { title, description, timeLimitMinutes, passingScore, rewardXp, isPublished, createdById } = data;
    const [result] = await db.insert(quiz).values({
      title,
      description: description || null,
      timeLimitMinutes: timeLimitMinutes ? parseInt(timeLimitMinutes) : null,
      passingScore: passingScore ? parseInt(passingScore) : 70,
      rewardXp: rewardXp ? parseInt(rewardXp) : 0,
      isPublished: Boolean(isPublished),
      createdById,
    }).returning();
    revalidatePath("/quiz");
    return { success: true, quiz: { ...result, questionCount: 0 } };
  } catch (error) {
    console.error("Error createQuiz:", error);
    return { success: false, error: error.message };
  }
}

export async function updateQuiz(id, data) {
  try {
    const { title, description, timeLimitMinutes, passingScore, rewardXp, isPublished } = data;
    const [result] = await db.update(quiz)
      .set({
        title,
        description: description || null,
        timeLimitMinutes: timeLimitMinutes ? parseInt(timeLimitMinutes) : null,
        passingScore: passingScore ? parseInt(passingScore) : 70,
        rewardXp: rewardXp ? parseInt(rewardXp) : 0,
        isPublished: Boolean(isPublished),
      })
      .where(eq(quiz.id, id))
      .returning();
    revalidatePath("/quiz");
    return { success: true, quiz: result };
  } catch (error) {
    console.error("Error updateQuiz:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteQuiz(id) {
  try {
    const quizId = parseInt(id);
    if (isNaN(quizId)) {
      return { success: false, error: "ID Quiz tidak valid." };
    }
    // Delete related submissions and questions explicitly, cascading will also cover it at DB level
    await db.delete(quizSubmission).where(eq(quizSubmission.quizId, quizId));
    await db.delete(quizQuestion).where(eq(quizQuestion.quizId, quizId));
    await db.delete(quiz).where(eq(quiz.id, quizId));
    revalidatePath("/quiz");
    revalidatePath("/member/quiz");
    return { success: true };
  } catch (error) {
    console.error("Error deleteQuiz:", error);
    return { success: false, error: error.message || "Gagal menghapus quiz." };
  }
}

export async function createQuizQuestion(quizId, data) {
  try {
    const { type, question, options, correctOptionId, points } = data;

    const existing = await db.query.quizQuestion.findMany({
      where: (t, { eq }) => eq(t.quizId, quizId),
      orderBy: [desc(quizQuestion.order)],
      limit: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order + 1 : 1;

    const [result] = await db.insert(quizQuestion).values({
      quizId,
      order: nextOrder,
      type,
      question,
      options: options || [],
      correctOptionId: correctOptionId || null,
      points: points ? parseInt(points) : 1,
    }).returning();

    revalidatePath("/quiz");
    return { success: true, question: result };
  } catch (error) {
    console.error("Error createQuizQuestion:", error);
    return { success: false, error: error.message };
  }
}

export async function updateQuizQuestion(questionId, data) {
  try {
    const { type, question, options, correctOptionId, points, order } = data;
    const [result] = await db.update(quizQuestion)
      .set({
        type,
        question,
        options: options || [],
        correctOptionId: correctOptionId || null,
        points: points ? parseInt(points) : 1,
        ...(order !== undefined ? { order: parseInt(order) } : {}),
      })
      .where(eq(quizQuestion.id, questionId))
      .returning();
    revalidatePath("/quiz");
    return { success: true, question: result };
  } catch (error) {
    console.error("Error updateQuizQuestion:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteQuizQuestion(questionId, quizId) {
  try {
    await db.delete(quizQuestion).where(eq(quizQuestion.id, questionId));

    // Reorder questions
    const remaining = await db.query.quizQuestion.findMany({
      where: (t, { eq }) => eq(t.quizId, quizId),
      orderBy: [asc(quizQuestion.order)],
    });

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].order !== i + 1) {
        await db.update(quizQuestion).set({ order: i + 1 }).where(eq(quizQuestion.id, remaining[i].id));
      }
    }

    revalidatePath("/quiz");
    return { success: true };
  } catch (error) {
    console.error("Error deleteQuizQuestion:", error);
    return { success: false, error: error.message };
  }
}

export async function gradeQuizSubmission(submissionId, data) {
  try {
    const { essayScore, gradedById } = data;
    const score = parseInt(essayScore);

    const submission = await db.query.quizSubmission.findFirst({
      where: eq(quizSubmission.id, submissionId),
      with: { quiz: true },
    });

    if (!submission) return { success: false, error: "Submission not found" };

    const totalScore = (submission.mcqScore || 0) + score;
    const isPassed = totalScore >= (submission.quiz.passingScore ?? 70);
    const wasPassed = submission.isPassed;

    const [result] = await db.update(quizSubmission)
      .set({
        essayScore: score,
        totalScore,
        isPassed,
        gradedById,
        gradedAt: new Date(),
      })
      .where(eq(quizSubmission.id, submissionId))
      .returning();

    if (isPassed && !wasPassed && submission.quiz.rewardXp > 0) {
      const profile = await db.query.memberProfile.findFirst({
        where: eq(memberProfile.userId, submission.memberId),
      });

      const gainedXp = submission.quiz.rewardXp;
      if (!profile) {
        await db.insert(memberProfile).values({
          userId: submission.memberId,
          xp: gainedXp,
          level: 1,
        });
      } else {
        const nextXp = profile.xp + gainedXp;
        const nextLevel = Math.floor(nextXp / 100) + 1;
        await db.update(memberProfile)
          .set({ xp: nextXp, level: nextLevel })
          .where(eq(memberProfile.userId, submission.memberId));
      }

      await db.insert(xpTransaction).values({
        userId: submission.memberId,
        amount: gainedXp,
        reason: `Evaluasi Kuis: ${submission.quiz.title}`,
        sourceType: "quiz",
        sourceId: submissionId,
      });
    }

    revalidatePath("/quiz");
    return { success: true, submission: result };
  } catch (error) {
    console.error("Error gradeQuizSubmission:", error);
    return { success: false, error: error.message };
  }
}
