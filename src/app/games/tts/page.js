import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getTTSList, getTTSById } from "@/app/actions/ttsActions";
import TTSParticipantPlayer from "./TTSParticipantPlayer";
import Link from "next/link";
import {
  ArrowLeft, Grid3X3, Clock, Sparkles, HelpCircle,
  Play, Plus, Award, ChevronRight, Search
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Katalog Penugasan TTS | SRE UPNVJT",
  description: "Daftar penugasan dan game Teka-Teki Silang interaktif SRE UPN Veteran Jawa Timur.",
};

export default async function TTSGamesIndexPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const id = resolvedSearchParams?.id;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    const callback = id ? `/games/tts?id=${id}` : "/games/tts";
    redirect(`/login?callbackUrl=${encodeURIComponent(callback)}`);
  }

  // If specific ID is requested via query param ?id=...
  if (id) {
    const res = await getTTSById(id);
    if (res.success && res.data) {
      return <TTSParticipantPlayer puzzleData={res.data} onBackUrl="/games/tts" currentUser={session.user} />;
    }
  }

  // Otherwise, load public list of TTS assignments
  const listRes = await getTTSList();
  const ttsList = listRes.success ? listRes.data : [];

  return (
    <div className="min-h-screen bg-[#07130e] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500/30">
      {/* BACKGROUND GLOW */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[400px] bg-teal-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* HEADER BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <Link
            href="/tts"
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Buat / Kelola TTS (Dashboard)</span>
          </Link>
        </div>

        {/* HERO TITLE */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Crossword</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Penugasan & Game <span className="text-emerald-400">Teka-Teki Silang</span>
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Pilih penugasan di bawah ini untuk mulai mengerjakan lembar teka-teki silang interaktif dengan validasi langsung.
          </p>
        </div>

        {/* LIST OF TTS PUZZLES */}
        {ttsList && ttsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ttsList.map((puzzle) => {
              return (
                <div
                  key={puzzle.id}
                  className="bg-slate-900/60 backdrop-blur-md border border-white/10 hover:border-emerald-500/40 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black">
                        <Grid3X3 className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                          {puzzle.validationMode === "MODAL" ? "Validasi Kotak" : "Cek di Akhir"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                        {puzzle.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {puzzle.description || "Teka-teki silang interaktif SRE UPN Veteran Jawa Timur."}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{puzzle.questionCount || puzzle.questions?.length || 0} Soal</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {puzzle.timeLimitMinutes ? `${puzzle.timeLimitMinutes} Menit` : "Tanpa Batas"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4">
                    <Link
                      href={`/games/tts/${puzzle.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Mulai Kerjakan</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-gray-400">
              <Grid3X3 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Belum Ada Penugasan TTS</h3>
              <p className="text-xs text-gray-400">
                Belum ada lembar TTS yang disimpan di database. Buat lembar pertama Anda sekarang!
              </p>
            </div>
            <Link
              href="/tts"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Penugasan Baru</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
