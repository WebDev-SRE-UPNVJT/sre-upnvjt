"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, MapPin, Tag, ExternalLink, X, ArrowLeft, ArrowRight,
  Send, Sparkles, CheckCircle2, AlertTriangle, Activity,
} from "lucide-react";
import { resolveImageUrl } from "@/lib/imageUrl";

export default function EventsClient({ initialEvents }) {
  const [events] = useState(initialEvents || []);
  const [activeEvent, setActiveEvent] = useState(null); // for detail view modal
  
  // Registration Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [teamName, setTeamName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleOpenDetail = (ev) => {
    setActiveEvent(ev);
    setFullName("");
    setEmail("");
    setTeamName("");
    setError("");
    setSuccess("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!activeEvent) return;
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/events/${activeEvent.id}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          teamName: activeEvent.category === "LOMBA" ? teamName : null,
          registrationType: activeEvent.registrationType,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("Pendaftaran berhasil dikirim! Silakan tunggu konfirmasi email.");
        setTimeout(() => setActiveEvent(null), 2000);
      } else {
        setError(data.error || "Gagal melakukan registrasi");
      }
    } catch {
      setError("Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07130e] text-white pt-32 pb-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Top Title Section */}
        <div className="mb-12 text-center md:text-left">
          <span className="text-xs font-black text-primary tracking-widest uppercase mb-2 block">AGENDA KEGIATAN</span>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-white mb-4">
            Events & Kegiatan SRE
          </h1>
          <p className="text-gray-400 max-w-xl font-light text-sm md:text-base">
            Temukan seminar transisi energi, workshop teknologi hijau, dan berbagai kompetisi berskala nasional di SRE UPNVJT.
          </p>
        </div>

        {/* Card Grid */}
        {events.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-white/5 border border-dashed border-white/10 rounded-3xl">
            <Activity className="w-12 h-12 text-gray-600 mb-4 animate-pulse" />
            <h3 className="text-lg font-bold text-white mb-1">Belum ada event terdekat</h3>
            <p className="text-gray-500 text-sm">Ikuti terus media sosial kami untuk update event terbaru berikutnya!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map(ev => (
              <div
                key={ev.id}
                onClick={() => handleOpenDetail(ev)}
                className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer group shadow-lg"
              >
                {/* Banner image */}
                <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border-b border-white/5">
                  {ev.bannerUrl ? (
                    <img src={resolveImageUrl(ev.bannerUrl)} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary/30">
                      <Activity className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded bg-black/50 text-white backdrop-blur-md border border-white/10 text-[9px] font-bold uppercase tracking-wider">
                      {ev.category}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm line-clamp-1 mb-2 group-hover:text-primary transition-all">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-6">
                      {ev.description}
                    </p>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>
                          {new Date(ev.eventDate).toLocaleDateString("id-ID", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </span>
                      </div>
                      {ev.location && (
                        <div className="flex items-center gap-2 text-[11px] text-gray-400">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-primary">
                    <span>Lihat Detail</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Public Event Detail & Registration Modal */}
      <AnimatePresence>
        {activeEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveEvent(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0a1612] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary animate-pulse" />
                  Informasi & Pendaftaran Event
                </h2>
                <button onClick={() => setActiveEvent(null)} className="text-gray-400 hover:text-white p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{activeEvent.title}</h3>
                  <div className="flex flex-wrap gap-4 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                      {activeEvent.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {new Date(activeEvent.eventDate).toLocaleDateString("id-ID", {
                        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {activeEvent.description}
                  </div>
                </div>

                {/* Registration Form */}
                <div className="border-t border-white/5 pt-6">
                  {activeEvent.registrationType === "OPEN" ? (
                    <form onSubmit={handleRegister} className="space-y-4">
                      <h4 className="text-xs font-black tracking-widest text-gray-400 uppercase mb-2">Formulir Pendaftaran Peserta</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold tracking-wider text-gray-500 uppercase mb-2">Nama Lengkap *</label>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                            placeholder="e.g. Jane Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold tracking-wider text-gray-500 uppercase mb-2">Email Aktif *</label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                            placeholder="e.g. janedoe@example.com"
                          />
                        </div>
                      </div>

                      {activeEvent.category === "LOMBA" && (
                        <div>
                          <label className="block text-[10px] font-bold tracking-wider text-gray-500 uppercase mb-2">Nama Tim / Instansi *</label>
                          <input
                            type="text"
                            required
                            value={teamName}
                            onChange={e => setTeamName(e.target.value)}
                            className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                            placeholder="e.g. Tim Renewable UPN"
                          />
                        </div>
                      )}

                      {error && <div className="text-xs font-semibold text-red-400 flex items-center gap-1.5"><AlertTriangle className="w-4.5 h-4.5 shrink-0" /> {error}</div>}
                      {success && <div className="text-xs font-semibold text-green-400 flex items-center gap-1.5"><CheckCircle2 className="w-4.5 h-4.5 shrink-0" /> {success}</div>}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 bg-primary text-[#050e0a] hover:bg-primary-focus transition-all rounded-xl font-bold flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-[#050e0a]/30 border-t-[#050e0a] rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Kirim Pendaftaran</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl flex gap-2 items-center">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <span>Pendaftaran untuk kegiatan ini telah ditutup atau bersifat internal (Invitation Only).</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
