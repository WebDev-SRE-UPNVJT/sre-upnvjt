"use client";

import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle2, Lock, Clock } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function TTSStatusNotice({
  type,
  prerequisiteTaskTitle = "",
  ttsTitle = "",
  submission = null,
  error = "",
  taskId = null,
  backUrl = "/member/tugas",
}) {
  const { language } = useLanguage();

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
        <div className="max-w-md w-full bg-[#0c2218]/90 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-md">
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
                  You have already completed the assignment <strong>{ttsTitle}</strong>. This assignment is strictly limited to 1 attempt.
                </>
              ) : (
                <>
                  Anda sudah menyelesaikan penugasan <strong>{ttsTitle}</strong>. Penugasan ini dibatasi hanya 1 kali pengerjaan.
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

          <Link
            href={backUrl}
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all shadow-lg shadow-emerald-500/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === "en" ? "Back to Task List" : "Kembali ke Daftar Tugas"}</span>
          </Link>
        </div>
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
