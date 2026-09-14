"use server";

import { db } from "@/lib/db";
import { ttsCrossword, ttsQuestion, user } from "@/db/schema";
import { desc, asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") + "-" + Math.random().toString(36).substring(2, 7);
}

/**
 * Get all TTS puzzles
 */
export async function getTTSList() {
  try {
    const list = await db.query.ttsCrossword.findMany({
      with: {
        createdBy: { columns: { id: true, name: true, email: true } },
        questions: {
          orderBy: [asc(ttsQuestion.order)],
        },
      },
      orderBy: [desc(ttsCrossword.createdAt)],
    });

    // Compute stats
    const formatted = list.map((item) => {
      const totalPoints = item.questions.reduce((sum, q) => sum + (q.points || 0), 0);
      return {
        ...item,
        questionCount: item.questions.length,
        totalPoints,
      };
    });

    return { success: true, data: formatted };
  } catch (error) {
    console.error("Error getTTSList:", error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get single TTS puzzle by ID
 */
export async function getTTSById(id) {
  try {
    const numericId = parseInt(id);
    if (isNaN(numericId)) return { success: false, error: "ID tidak valid" };

    const puzzle = await db.query.ttsCrossword.findFirst({
      where: eq(ttsCrossword.id, numericId),
      with: {
        createdBy: { columns: { id: true, name: true, email: true } },
        questions: {
          orderBy: [asc(ttsQuestion.order)],
        },
      },
    });

    if (!puzzle) return { success: false, error: "TTS tidak ditemukan" };

    return { success: true, data: puzzle };
  } catch (error) {
    console.error("Error getTTSById:", error);
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Save TTS (Create or Update with questions, answers, and points per question)
 */
export async function saveTTS(payload) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Harap login terlebih dahulu" };
    }

    const {
      id,
      title,
      description,
      timeLimitMinutes,
      rewardXp,
      validationMode = "MODAL",
      wrongAnswerBehavior = "RETRY",
      isPublished = true,
      items = [], // [{ id, clue, answer }]
    } = payload;

    if (!title || !title.trim()) {
      return { success: false, error: "Judul TTS wajib diisi" };
    }

    const validQuestions = items
      .filter((it) => it.clue && it.clue.trim() && it.answer && it.answer.trim())
      .map((it, idx) => ({
        clue: it.clue.trim(),
        answer: String(it.answer).toUpperCase().replace(/[^A-Z0-9]/g, ""),
        points: 10,
        order: idx,
      }));

    if (validQuestions.length < 2) {
      return { success: false, error: "Minimal masukkan 2 pertanyaan dan jawaban yang valid" };
    }

    let savedCrosswordId = id ? parseInt(id) : null;

    if (savedCrosswordId) {
      // UPDATE EXISTING
      await db
        .update(ttsCrossword)
        .set({
          title: title.trim(),
          description: description?.trim() || null,
          timeLimitMinutes: timeLimitMinutes ? parseInt(timeLimitMinutes) : null,
          rewardXp: rewardXp ? parseInt(rewardXp) : 10,
          validationMode: validationMode || "MODAL",
          wrongAnswerBehavior: wrongAnswerBehavior || "RETRY",
          isPublished: Boolean(isPublished),
          updatedAt: new Date(),
        })
        .where(eq(ttsCrossword.id, savedCrosswordId));

      // Replace questions
      await db.delete(ttsQuestion).where(eq(ttsQuestion.crosswordId, savedCrosswordId));
      if (validQuestions.length > 0) {
        await db.insert(ttsQuestion).values(
          validQuestions.map((q) => ({
            crosswordId: savedCrosswordId,
            clue: q.clue,
            answer: q.answer,
            points: q.points,
            order: q.order,
          }))
        );
      }
    } else {
      // CREATE NEW
      const slug = generateSlug(title);
      const [newCrossword] = await db
        .insert(ttsCrossword)
        .values({
          title: title.trim(),
          slug,
          description: description?.trim() || null,
          timeLimitMinutes: timeLimitMinutes ? parseInt(timeLimitMinutes) : null,
          rewardXp: rewardXp ? parseInt(rewardXp) : 10,
          validationMode: validationMode || "MODAL",
          wrongAnswerBehavior: wrongAnswerBehavior || "RETRY",
          isPublished: Boolean(isPublished),
          createdById: parseInt(session.user.id),
        })
        .returning();

      savedCrosswordId = newCrossword.id;

      if (validQuestions.length > 0) {
        await db.insert(ttsQuestion).values(
          validQuestions.map((q) => ({
            crosswordId: savedCrosswordId,
            clue: q.clue,
            answer: q.answer,
            points: q.points,
            order: q.order,
          }))
        );
      }
    }

    revalidatePath("/tts");
    revalidatePath("/games/tts");

    return { success: true, id: savedCrosswordId, message: "TTS berhasil disimpan ke database!" };
  } catch (error) {
    console.error("Error saveTTS:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete TTS Puzzle
 */
export async function deleteTTS(id) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Harap login terlebih dahulu" };
    }

    const numericId = parseInt(id);
    if (isNaN(numericId)) return { success: false, error: "ID tidak valid" };

    await db.delete(ttsCrossword).where(eq(ttsCrossword.id, numericId));

    revalidatePath("/tts");
    revalidatePath("/games/tts");

    return { success: true, message: "TTS berhasil dihapus" };
  } catch (error) {
    console.error("Error deleteTTS:", error);
    return { success: false, error: error.message };
  }
}
