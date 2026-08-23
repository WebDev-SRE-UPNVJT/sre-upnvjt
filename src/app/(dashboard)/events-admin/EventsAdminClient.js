"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, X, Search, CheckCircle2, XCircle,
  AlertTriangle, Calendar, MapPin, Tag, Users, Filter,
  Link2, UploadCloud, Check, Activity,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { hasAccess } from "@/lib/permissions";
import { resolveImageUrl } from "@/lib/imageUrl";

const EMPTY_EVENT = {
  title: "", description: "", bannerUrl: "", eventDate: "",
  location: "", category: "SEMINAR", registrationType: "OPEN",
};

const CATEGORIES = ["SEMINAR", "WORKSHOP", "LOMBA", "SHARING_SESSION", "WEBINAR", "OTHER"];
const REG_TYPES = ["OPEN", "CLOSE", "INVITATION"];

export default function EventsAdminClient({ initialEvents, initialRegistrations, currentUser }) {
  const { data: session } = useSession();
  const user = session?.user ?? currentUser;

  const [activeTab, setActiveTab] = useState("events"); // "events" | "registrations"
  const [events, setEvents] = useState(initialEvents || []);
  const [registrations, setRegistrations] = useState(initialRegistrations || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEvent, setFilterEvent] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Event Modal State
  const [eventModal, setEventModal] = useState(false);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT);
  const [targetEvent, setTargetEvent] = useState(null);
  const [eventDelModal, setEventDelModal] = useState(false);

  const canCreate = hasAccess(user, "events", "create");
  const canUpdate = hasAccess(user, "events", "update");
  const canDelete = hasAccess(user, "events", "delete");

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { notify("error", "Harap pilih file gambar"); return; }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "events");
    setIsLoading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setEventForm(p => ({ ...p, bannerUrl: data.url }));
        notify("success", "Banner berhasil diunggah!");
      } else {
        notify("error", data.error || "Gagal mengunggah banner");
      }
    } catch {
      notify("error", "Terjadi kesalahan saat upload");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEventModal = (ev = null) => {
    if (ev) {
      const date = new Date(ev.eventDate);
      const tzOffset = date.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
      
      setEventForm({
        title: ev.title,
        description: ev.description || "",
        bannerUrl: ev.bannerUrl || "",
        eventDate: localISOTime,
        location: ev.location || "",
        category: ev.category || "SEMINAR",
        registrationType: ev.registrationType || "OPEN",
      });
    } else {
      setEventForm({ ...EMPTY_EVENT });
    }
    setTargetEvent(ev);
    setEventModal(true);
  };

  const handleCloseEventModal = () => {
    setEventModal(false);
    setTimeout(() => { setEventForm(EMPTY_EVENT); setTargetEvent(null); }, 300);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const isEditing = Boolean(targetEvent?.id);

    const url = isEditing ? `/api/events/${targetEvent.id}` : "/api/events";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventForm.title,
          description: eventForm.description,
          bannerUrl: eventForm.bannerUrl,
          eventDate: eventForm.eventDate,
          location: eventForm.location,
          category: eventForm.category,
          registrationType: eventForm.registrationType,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (isEditing) {
          setEvents(events.map(ev => ev.id === targetEvent.id ? data.event : ev));
        } else {
          setEvents([data.event, ...events]);
        }
        notify("success", isEditing ? "Event diperbarui!" : "Event baru dibuat!");
        handleCloseEventModal();
      } else {
        notify("error", data.error || "Gagal menyimpan event");
      }
    } catch {
      notify("error", "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!targetEvent?.id) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/events/${targetEvent.id}`, { method: "DELETE" });
      if (res.ok) {
        setEvents(events.filter(ev => ev.id !== targetEvent.id));
        setRegistrations(registrations.filter(r => r.eventId !== targetEvent.id));
        notify("success", "Event berhasil dihapus!");
        setEventDelModal(false);
      } else {
        const data = await res.json();
        notify("error", data.error || "Gagal menghapus event");
      }
    } catch {
      notify("error", "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewRegistration = async (regId, eventId, status) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: regId, status }),
      });

      const data = await res.json();
      if (res.ok) {
        setRegistrations(registrations.map(r => r.id === regId ? data.registration : r));
        notify("success", `Registrasi berhasil di-${status.toLowerCase()}!`);
      } else {
        notify("error", data.error || "Gagal memperbarui status");
      }
    } catch {
      notify("error", "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = events.filter(ev =>
    (ev.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ev.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ev.location || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRegistrations = registrations.filter(r => {
    const name = r.fullName || "";
    const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.teamName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchEvent = filterEvent === "all" || r.eventId?.toString() === filterEvent;
    return matchSearch && matchEvent;
  });

  return (
    <div className="w-full relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter mb-2 flex items-center gap-3 text-gray-900 dark:text-white">
            <Activity className="w-8 h-8 text-primary" />
            Events Management
          </h1>
          <p className="text-gray-500 dark:text-white/50 max-w-xl">
            Buat kegiatan seminar/lomba SRE UPNVJT dan kelola daftar registrasi peserta umum.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
            <input
              type="text"
              placeholder={activeTab === "events" ? "Cari event..." : "Cari nama / email..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none"
            />
          </div>
          {activeTab === "events" && canCreate && (
            <button
              onClick={() => handleOpenEventModal()}
              className="flex items-center gap-2 bg-primary text-[#050e0a] px-6 py-3 rounded-xl font-bold tracking-wide hover:bg-primary-focus hover:scale-105 transition-all shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-gray-100 dark:bg-white/[0.03] p-1 rounded-2xl w-fit border border-gray-200 dark:border-white/10">
        {[
          { key: "events", label: "Daftar Event", icon: Activity },
          { key: "registrations", label: "Pendaftar / Registrasi", icon: Users },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearchQuery(""); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Events */}
      {activeTab === "events" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredEvents.length === 0 ? (
              <div className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-white/40 dark:bg-white/[0.02] border border-dashed border-gray-200/50 dark:border-white/10 rounded-3xl">
                <Activity className="w-12 h-12 text-gray-400 dark:text-white/20 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Belum ada event</h3>
                <p className="text-gray-500 dark:text-white/40 text-sm">Buat event pertama untuk dipublikasikan.</p>
              </div>
            ) : filteredEvents.map(ev => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 shadow-lg rounded-3xl overflow-hidden backdrop-blur-xl group hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border-b border-gray-200 dark:border-white/5">
                  {ev.bannerUrl ? (
                    <img src={resolveImageUrl(ev.bannerUrl)} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-primary/40">
                      <Activity className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded bg-black/45 text-white backdrop-blur-md border border-white/15 text-[10px] font-bold uppercase tracking-wider">
                      {ev.category}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-primary text-[#050e0a] text-[10px] font-bold uppercase tracking-wider">
                      {ev.registrationType}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1 mb-2 group-hover:text-primary transition-all">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-white/40 line-clamp-2 mb-4">
                      {ev.description}
                    </p>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/50">
                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                        <span>
                          {new Date(ev.eventDate).toLocaleDateString("id-ID", {
                            day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </span>
                      </div>
                      {ev.location && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/50">
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-white/5">
                    {canUpdate && (
                      <button
                        onClick={() => handleOpenEventModal(ev)}
                        className="flex-1 h-9 rounded-xl bg-white dark:bg-white/5 shadow-sm border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white flex items-center justify-center gap-2 text-xs font-semibold"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => { setTargetEvent(ev); setEventDelModal(true); }}
                        className="h-9 w-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center border border-transparent hover:border-red-500/20 transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Tab: Registrations */}
      {activeTab === "registrations" && (
        <div>
          {/* Filters */}
          <div className="flex gap-3 mb-6 bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-2xl p-4 backdrop-blur-md items-center">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <Filter className="w-4 h-4 text-primary" />
              <span>Filter berdasarkan Event:</span>
            </div>
            <select
              value={filterEvent}
              onChange={e => setFilterEvent(e.target.value)}
              className="h-10 px-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none"
            >
              <option value="all">Semua Event</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id.toString()}>{ev.title}</option>
              ))}
            </select>
          </div>

          <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-lg">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                  <tr>
                    {["Nama Peserta", "Email", "Event", "Nama Tim", "Tipe", "Status", "Aksi"].map(h => (
                      <th key={h} className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  <AnimatePresence>
                    {filteredRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-white/30">
                            <Users className="w-10 h-10" />
                            <p className="font-medium">Belum ada registrasi peserta masuk</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredRegistrations.map(reg => (
                      <tr key={reg.id} className="hover:bg-white/60 dark:hover:bg-white/[0.03] transition-all">
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                          {reg.fullName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-white/70">
                          {reg.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-white/70 max-w-[200px] truncate">
                          {reg.event?.title || `ID Event: ${reg.eventId}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-white/50">
                          {reg.teamName || <span className="opacity-30">—</span>}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-500">
                          {reg.registrationType}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            reg.status === "CONFIRMED"
                              ? "bg-green-500/10 text-green-400 border-green-500/25"
                              : reg.status === "REJECTED"
                              ? "bg-red-500/10 text-red-400 border-red-500/25"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/25"
                          }`}>
                            {reg.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {canUpdate && reg.status === "PENDING" ? (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleReviewRegistration(reg.id, reg.eventId, "CONFIRMED")}
                                className="w-8 h-8 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 flex items-center justify-center transition-all border border-green-500/20"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReviewRegistration(reg.id, reg.eventId, "REJECTED")}
                                className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all border border-red-500/20"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-white/30">Tinjau Selesai</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Event Add/Edit Modal */}
      <AnimatePresence>
        {eventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseEventModal} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  {targetEvent ? "Edit Kegiatan" : "Event Baru"}
                </h2>
                <button onClick={handleCloseEventModal} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                <form id="eventForm" onSubmit={handleSaveEvent} className="space-y-5">
                  <InputField label="Judul Event *">
                    <input type="text" required value={eventForm.title}
                      onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))}
                      className={inputCls} placeholder="e.g. SRE Grand Webinar 2026" />
                  </InputField>

                  <InputField label="Deskripsi">
                    <textarea rows={3} value={eventForm.description}
                      onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))}
                      className={`${textareaCls} h-20`} placeholder="Detail rincian kegiatan..." />
                  </InputField>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Tanggal Pelaksanaan *">
                      <input type="datetime-local" required value={eventForm.eventDate}
                        onChange={e => setEventForm(p => ({ ...p, eventDate: e.target.value }))}
                        className={inputCls} />
                    </InputField>

                    <InputField label="Lokasi / Platform">
                      <input type="text" value={eventForm.location}
                        onChange={e => setEventForm(p => ({ ...p, location: e.target.value }))}
                        className={inputCls} placeholder="e.g. Zoom Meeting / Aula Gedung A" />
                    </InputField>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Kategori Event">
                      <select value={eventForm.category}
                        onChange={e => setEventForm(p => ({ ...p, category: e.target.value }))}
                        className={inputCls}
                      >
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </InputField>

                    <InputField label="Tipe Pendaftaran">
                      <select value={eventForm.registrationType}
                        onChange={e => setEventForm(p => ({ ...p, registrationType: e.target.value }))}
                        className={inputCls}
                      >
                        {REG_TYPES.map(reg => <option key={reg} value={reg}>{reg}</option>)}
                      </select>
                    </InputField>
                  </div>

                  <InputField label="Banner Event (URL atau Upload)">
                    <div className="flex gap-3 items-start">
                      {eventForm.bannerUrl && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/30">
                          <img src={resolveImageUrl(eventForm.bannerUrl)} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col gap-2">
                        <input type="text" value={eventForm.bannerUrl}
                          onChange={e => setEventForm(p => ({ ...p, bannerUrl: e.target.value }))}
                          className={inputCls} placeholder="https://..." />
                        <label className={`relative overflow-hidden flex items-center gap-2 h-10 px-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer ${isLoading ? "opacity-50 pointer-events-none" : ""}`}>
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <UploadCloud className="w-4 h-4" /> Upload banner gambar
                        </label>
                      </div>
                    </div>
                  </InputField>
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
                <button type="button" onClick={handleCloseEventModal} className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-500 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10">Batal</button>
                <button type="submit" form="eventForm" disabled={isLoading}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-[#050e0a] hover:bg-primary-focus flex items-center gap-2">
                  {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Simpan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event Delete Modal */}
      <AnimatePresence>
        {eventDelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEventDelModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/25">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hapus Event?</h3>
              <p className="text-xs text-gray-500 dark:text-white/40 mb-6">Seluruh data registrasi peserta untuk event ini juga akan terhapus secara permanen.</p>
              <div className="flex gap-3">
                <button onClick={() => setEventDelModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5">Batal</button>
                <button onClick={handleDeleteEvent} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600">Hapus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <Toast notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
}

// Extracted toast component
function Toast({ notification, onClose }) {
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${
            notification.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {notification.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="font-medium text-xs">{notification.message}</span>
          <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const inputCls =
  "w-full h-12 px-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all";

const textareaCls =
  "w-full p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all resize-none";

const InputField = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">
      {label}
    </label>
    {children}
  </div>
);
