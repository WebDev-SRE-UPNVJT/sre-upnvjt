"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle2, Lock, Clock, Share2, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { generateCrosswordLayout } from "@/lib/crosswordGenerator";
import TTSShareCardModal from "./TTSShareCardModal";

export default function TTSStatusNotice({
  type,
  prerequisiteTaskTitle = "",
  ttsTitle = "",
  submission = null,
  error = "",
  taskId = null,
  backUrl = "/member/tugas",
  puzzleData = null,
  currentUser = null,
}) {
  const { language } = useLanguage();
  const [showShareModal, setShowShareModal] = useState(false);

  // Generate crossword layout & filled inputs if puzzleData is passed
  const items = useMemo(() => {
    if (puzzleData?.questions && puzzleData.questions.length > 0) {
      return puzzleData.questions.map((q, idx) => ({
        id: q.id || `q_${idx + 1}`,
        clue: q.clue,
        answer: q.answer,
      }));
    }
    return [];
  }, [puzzleData]);

  const crosswordData = useMemo(() => {
    if (items.length > 0) {
      return generateCrosswordLayout(items, { maxIterations: 80, seed: 42 });
    }
    return null;
  }, [items]);

  // Pre-fill answers from questions
  const userInputs = useMemo(() => {
    if (!crosswordData?.placedWords) return {};
    const map = {};
    crosswordData.placedWords.forEach((pw) => {
      const isAcross = pw.direction === "ACROSS";
      for (let i = 0; i < pw.length; i++) {
        const r = isAcross ? pw.row : pw.row + i;
        const c = isAcross ? pw.col + i : pw.col;
        map[`${r},${c}`] = pw.answer[i];
      }
    });
    return map;
  }, [crosswordData]);

  const wordStatuses = useMemo(() => {
    if (!crosswordData?.placedWords) return {};
    const map = {};
    crosswordData.placedWords.forEach((pw) => {
      map[`${pw.direction}-${pw.number}`] = "CORRECT";
    });
    return map;
  }, [crosswordData]);

  if (type === "closed") {
    return (
      <div className="min-h-screen bg-[#07130e] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#180c0c]/90 border border-rose-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white">
              {language === "en" ? "Assignment Closed (Overdue) ⏰" : "Pengumpulan Ditutup ⏰"}
            </h1>
            <p className="text-xs text-gray-300 leading-relaxed">
              {language === "en" ? (
                <>
                  The deadline for <strong>{ttsTitle || "this crossword"}</strong> has passed and late submissions are not allowed for this quest.
                </>
              ) : (
                <>
                  Tenggat waktu pengerjaan <strong>{ttsTitle || "TTS ini"}</strong> telah berakhir dan pengumpulan tugas terlambat tidak diizinkan untuk misi ini.
                </>
              )}
            </p>
          </div>

          <Link
            href={backUrl}
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs transition-all shadow-lg shadow-rose-500/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === "en" ? "Back to Task List" : "Kembali ke Daftar Tugas"}</span>
          </Link>
        </div>
      </div>
    );
  }

  if (type === "locked") {
    return (
      <div className="min-h-screen bg-[#07130e] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#181308]/90 border border-amber-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white">
              {language === "en" ? "Crossword Mission Locked 🔒" : "Misi TTS Terkunci 🔒"}
            </h1>
            <p className="text-xs text-gray-300 leading-relaxed">
              {language === "en" ? (
                <>
                  This assignment is a locked Side Quest. You must complete and receive an approved status (<strong>APPROVED</strong>) on Main Quest{" "}
                  <strong>&quot;{prerequisiteTaskTitle || "Prerequisite"}&quot;</strong> before you can access and play this Crossword puzzle.
                </>
              ) : (
                <>
                  Penugasan ini adalah Side Quest yang terkunci. Anda harus menyelesaikan dan menunggu persetujuan (status <strong>APPROVED</strong>) pada Main Quest{" "}
                  <strong>&quot;{prerequisiteTaskTitle || "Prasyarat"}&quot;</strong> sebelum dapat mengerjakan TTS ini.
                </>
              )}
            </p>
          </div>

          <Link
            href={backUrl}
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === "en" ? "Back to Task List" : "Kembali ke Daftar Tugas"}</span>
          </Link>
        </div>
      </div>
    );
  }

  if (type === "completed") {
    return (
      <div className="min-h-screen bg-[#07130e] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0c2218]/90 border border-emerald-500/40 rounded-3xl p-7 sm:p-8 text-center space-y-5 shadow-2xl backdrop-blur-md">
          {/* SRE Brand Header */}
          <div className="flex items-center justify-center gap-2">
            <div
              className="h-6 w-24 shrink-0 bg-white"
              style={{
                WebkitMaskImage: "url(/images/logo.webp)",
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center center",
                maskImage: "url(/images/logo.webp)",
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center center",
              }}
            />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
              SRE UPN Veteran Jawa Timur
            </span>
          </div>

          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white">
              {language === "en" ? "Crossword Task Completed" : "Tugas TTS Sudah Selesai"}
            </h1>
            <p className="text-xs text-gray-300">
              {language === "en" ? (
                <>
                  You have already completed the assignment <strong>{ttsTitle}</strong>. You can still share your achievement card to social media!
                </>
              ) : (
                <>
                  Anda sudah menyelesaikan penugasan <strong>{ttsTitle}</strong>. Anda tetap dapat membagikan kartu hasil pengerjaan ke media sosial!
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-black/40 rounded-2xl border border-white/10 text-left">
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-400">
                {language === "en" ? "Score" : "Skor"}
              </div>
              <div className="text-lg font-black text-emerald-400">{submission?.score ?? 100}%</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-400">
                {language === "en" ? "XP Earned" : "XP Diperoleh"}
              </div>
              <div className="text-lg font-black text-amber-400">+{submission?.xpEarned ?? 0} XP</div>
            </div>
            <div className="col-span-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
              <span>{language === "en" ? "Status:" : "Status:"}</span>
              <span className="font-bold text-emerald-400">
                {language === "en" ? "Completed (1x Attempt)" : "Selesai (1x Pengerjaan)"}
              </span>
            </div>
          </div>

          {/* BUTTONS: SHARE TO SOCIAL MEDIA & BACK */}
          <div className="space-y-2.5 pt-1">
            {puzzleData && crosswordData && (
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer active:scale-95"
              >
                <Share2 className="w-4 h-4 stroke-[2.5]" />
                <span>Bagikan Kartu Hasil (Story 9:16)</span>
                <Sparkles className="w-4 h-4 fill-current animate-pulse" />
              </button>
            )}

            <Link
              href={backUrl}
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-extrabold text-xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === "en" ? "Back to Task List" : "Kembali ke Daftar Tugas"}</span>
            </Link>
          </div>
        </div>

        {/* SHARE MODAL */}
        {puzzleData && crosswordData && (
          <TTSShareCardModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            puzzleData={puzzleData}
            crosswordData={crosswordData}
            userInputs={userInputs}
            wordStatuses={wordStatuses}
            stats={{
              elapsedTime: submission?.elapsedSeconds || 120,
              mistakeCount: 0,
              xpEarned: submission?.xpEarned || puzzleData?.rewardXp || 10,
              score: submission?.score ?? 100,
              starsEarned: 3,
            }}
            currentUser={currentUser}
          />
        )}
      </div>
    );
  }

  // Not found
  return (
    <div className="min-h-screen bg-[#07130e] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/80 border border-white/10 rounded-3xl p-8 text-center space-y-5 shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-black text-white">
            {language === "en" ? "Assignment Not Found" : "Penugasan Tidak Ditemukan"}
          </h1>
          <p className="text-xs text-gray-400">
            {error ||
              (language === "en"
                ? "The crossword puzzle you are looking for may have been deleted or the URL is incorrect."
                : "Teka-teki silang yang Anda cari mungkin telah dihapus atau URL salah.")}
          </p>
        </div>
        <Link
          href={backUrl}
          className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all shadow-lg shadow-emerald-500/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {taskId
              ? language === "en"
                ? "Back to Task List"
                : "Kembali ke Daftar Tugas"
              : language === "en"
              ? "Back to Crossword List"
              : "Kembali ke Daftar TTS"}
          </span>
        </Link>
      </div>
    </div>
  );
}
