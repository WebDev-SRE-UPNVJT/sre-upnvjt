"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, ShieldCheck, Mail, BookOpen, AlertTriangle } from "lucide-react";

export default function JoinClient() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [npm, setNpm] = useState("");
  const [faculty, setFaculty] = useState("");
  const [motivation, setMotivation] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, npm, faculty, motivation }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Gagal mengirim pendaftaran");
      }
    } catch {
      setError("Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#07130e] text-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg bg-white/5 border border-white/10 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-md relative"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-black tracking-tight text-white mb-2">Terima Kasih!</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Pendaftaran Anda berhasil dikirimkan dan sedang diproses. Tim kami akan segera meninjau data Anda dan mengirimkan kabar selanjutnya ke email yang terdaftar.
          </p>
          <a
            href="/"
            className="inline-block py-3 px-8 bg-primary hover:bg-primary-focus text-[#050e0a] font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] text-xs uppercase tracking-wider"
          >
            Kembali Ke Beranda
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07130e] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-black tracking-tight text-white mb-2">Open Recruitment</h1>
          <p className="text-xs text-gray-500 font-semibold tracking-wider uppercase">Bergabung Menjadi Pengurus SRE UPNVJT</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-gray-500 uppercase mb-2">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-600"
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-gray-500 uppercase mb-2">Email Aktif *</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-600"
                placeholder="e.g. janedoe@example.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-gray-500 uppercase mb-2">NPM / NIM *</label>
              <input
                type="text"
                required
                value={npm}
                onChange={e => setNpm(e.target.value)}
                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-600"
                placeholder="e.g. 21081010..."
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-wider text-gray-500 uppercase mb-2">Fakultas / Program Studi *</label>
            <input
              type="text"
              required
              value={faculty}
              onChange={e => setFaculty(e.target.value)}
              className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-600"
              placeholder="e.g. Fakultas Ilmu Komputer"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-wider text-gray-500 uppercase mb-2">Motivasi Bergabung *</label>
            <textarea
              required
              rows={4}
              value={motivation}
              onChange={e => setMotivation(e.target.value)}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary/50 transition-all resize-none h-28 placeholder:text-gray-600 leading-relaxed"
              placeholder="Ceritakan motivasi Anda dan kontribusi apa yang ingin Anda berikan..."
            />
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex gap-2 items-center">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-primary text-[#050e0a] hover:bg-primary-focus transition-all rounded-xl font-bold flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-[#050e0a]/30 border-t-[#050e0a] rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim Formulir</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
