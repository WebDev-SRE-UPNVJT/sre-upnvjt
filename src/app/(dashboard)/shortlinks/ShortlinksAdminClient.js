"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Link2, Plus, Copy, ExternalLink, Activity, 
  Search, Loader2, Check, AlertCircle, Clock, X,
  Trash2, Edit3, Sparkles, QrCode, MousePointerClick, TrendingUp,
  Share2, CheckCircle2, User, Globe, ShieldCheck, ArrowUpRight,
  Ban, CheckCircle, RefreshCw, Filter, Building2, ChevronDown,
  AlertTriangle, ShieldAlert
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { hasAccess } from "@/lib/permissions";

export default function ShortlinksAdminClient({ initialLinks = [], currentUser }) {
  const { t, language } = useLanguage();
  const [links, setLinks] = useState(initialLinks);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, SUSPENDED
  const [sortBy, setSortBy] = useState("NEWEST"); // NEWEST, CLICKS, OLDEST, NAME
  const [notification, setNotification] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // RBAC Permissions
  const canCreate = hasAccess(currentUser, "shortlinks", "create");
  const canUpdate = hasAccess(currentUser, "shortlinks", "update");
  const canDelete = hasAccess(currentUser, "shortlinks", "delete");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal Form State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ slug: "", originalUrl: "", description: "", isActive: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Suspend / Toggle Modal State
  const [suspendModal, setSuspendModal] = useState({ isOpen: false, link: null });
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, link: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // QR Code Modal State
  const [qrModal, setQrModal] = useState({ isOpen: false, link: null });

  // Realtime Slug Check State
  const [isSlugAvailable, setIsSlugAvailable] = useState(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  // Copy State
  const [copiedId, setCopiedId] = useState(null);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchLinks = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/shortlink");
      if (res.ok) {
        const data = await res.json();
        setLinks(data.map(link => ({
          ...link,
          isActive: link.isActive !== undefined && link.isActive !== null ? link.isActive : true,
          createdAt: link.createdAt ? new Date(link.createdAt).toISOString() : null,
        })));
        showNotification(language === "id" ? "Data tautan berhasil diperbarui!" : "Shortlink data refreshed!", "success");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalLinks = links.length;
    const totalClicks = links.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
    const activeLinks = links.filter(l => l.isActive !== false).length;
    const suspendedLinks = links.filter(l => l.isActive === false).length;
    const topPerformer = [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0] || null;

    return { totalLinks, totalClicks, activeLinks, suspendedLinks, topPerformer };
  }, [links]);

  // Filtered and Sorted Links
  const filteredLinks = useMemo(() => {
    let result = links.filter(link => {
      // Status filter
      if (statusFilter === "ACTIVE" && link.isActive === false) return false;
      if (statusFilter === "SUSPENDED" && link.isActive !== false) return false;

      // Search query
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        link.slug.toLowerCase().includes(q) ||
        (link.description && link.description.toLowerCase().includes(q)) ||
        (link.originalUrl && link.originalUrl.toLowerCase().includes(q)) ||
        (link.creatorName && link.creatorName.toLowerCase().includes(q)) ||
        (link.creatorEmail && link.creatorEmail.toLowerCase().includes(q)) ||
        (link.departmentName && link.departmentName.toLowerCase().includes(q))
      );
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "CLICKS") return (b.clicks || 0) - (a.clicks || 0);
      if (sortBy === "OLDEST") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === "NAME") return a.slug.localeCompare(b.slug);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); // NEWEST
    });

    return result;
  }, [links, searchQuery, statusFilter, sortBy]);

  const handleCopy = (slug, id) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://sreupnjatim.com";
    const url = `${origin}/s/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showNotification(t("shortlinks.copied_toast", { slug }) || `Tautan /s/${slug} disalin ke papan klip!`, "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Real-time check for slug availability
  useEffect(() => {
    if (!formData.slug) {
      setIsSlugAvailable(null);
      return;
    }

    if (editingId) {
      const originalLink = links.find(l => l.id === editingId);
      if (originalLink && originalLink.slug === formData.slug) {
        setIsSlugAvailable(true);
        return;
      }
    }

    const checkAvailability = async () => {
      setIsCheckingSlug(true);
      try {
        const slugExists = links.some(l => l.slug.toLowerCase() === formData.slug.toLowerCase() && l.id !== editingId);
        setIsSlugAvailable(!slugExists);
      } catch (err) {
        console.error(err);
      } finally {
        setIsCheckingSlug(false);
      }
    };

    const debounce = setTimeout(checkAvailability, 300);
    return () => clearTimeout(debounce);
  }, [formData.slug, editingId, links]);

  const handleOpenModal = (link = null) => {
    setError(null);
    if (link) {
      setEditingId(link.id);
      setFormData({
        slug: link.slug,
        originalUrl: link.originalUrl,
        description: link.description || "",
        isActive: link.isActive !== false,
      });
    } else {
      setEditingId(null);
      setFormData({
        slug: "",
        originalUrl: "",
        description: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setError(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSlugAvailable === false) {
      setError(t("shortlinks.slug_taken") || "Slug ini sudah dipakai! Silakan ganti nama slug.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingId) {
        const res = await fetch(`/api/shortlink/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memperbarui tautan");

        setLinks(prev => prev.map(l => l.id === editingId ? { ...l, ...data } : l));
        showNotification(t("shortlinks.updated_toast") || "Tautan berhasil diperbarui!", "success");
      } else {
        const res = await fetch("/api/shortlink", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal membuat tautan");

        setLinks(prev => [data, ...prev]);
        showNotification(t("shortlinks.created_toast") || "Tautan baru berhasil dibuat!", "success");
      }
      handleCloseModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!suspendModal.link) return;
    const targetLink = suspendModal.link;
    const newStatus = targetLink.isActive === false ? true : false;
    setIsTogglingStatus(true);

    try {
      const res = await fetch(`/api/shortlink/${targetLink.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status tautan");

      setLinks(prev => prev.map(l => l.id === targetLink.id ? { ...l, isActive: newStatus } : l));
      
      if (newStatus === false) {
        showNotification(t("shortlinks.suspended_toast", { slug: targetLink.slug }) || `Tautan /s/${targetLink.slug} berhasil ditangguhkan!`, "error");
      } else {
        showNotification(t("shortlinks.activated_toast", { slug: targetLink.slug }) || `Tautan /s/${targetLink.slug} berhasil diaktifkan kembali!`, "success");
      }
      setSuspendModal({ isOpen: false, link: null });
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.link) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/shortlink/${deleteModal.link.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus tautan");
      }

      setLinks(prev => prev.filter(l => l.id !== deleteModal.link.id));
      showNotification(t("shortlinks.deleted_toast") || "Tautan berhasil dihapus permanen.", "success");
      setDeleteModal({ isOpen: false, link: null });
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const generateRandomSlug = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let autoSlug = "";
    for (let i = 0; i < 6; i++) {
      autoSlug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, slug: autoSlug }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  return (
    <div className="w-full relative space-y-8 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold backdrop-blur-xl ${
              notification.type === "success"
                ? "bg-emerald-500/90 text-white border-emerald-400/50 shadow-emerald-900/20"
                : "bg-rose-500/90 text-white border-rose-400/50 shadow-rose-900/20"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-white shrink-0" />
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-emerald-500/10 text-primary dark:text-emerald-400 border border-primary/20 dark:border-emerald-500/20">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">
                {t("shortlinks.admin_monitoring_title") || "Monitoring SRE Links"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {t("shortlinks.admin_monitoring_subtitle") || "Awasi seluruh tautan singkat yang dibuat oleh staf, pantau analitik klik, dan tangguhkan tautan yang tidak sesuai aturan."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLinks}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all duration-200 shadow-sm disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">{language === "id" ? "Segarkan" : "Refresh"}</span>
          </button>

          {canCreate && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white dark:text-slate-950 dark:bg-emerald-400 dark:hover:bg-emerald-300 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-primary/20 dark:shadow-emerald-400/20 transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t("shortlinks.create_new") || "Buat Tautan Baru"}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Links */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("shortlinks.stat_total_links") || "Total Tautan"}
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Link2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-display font-black text-slate-900 dark:text-white">
              {stats.totalLinks}
            </span>
          </div>
        </div>

        {/* Total Clicks */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("shortlinks.stat_total_clicks") || "Total Klik / Trafik"}
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <MousePointerClick className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-display font-black text-slate-900 dark:text-white">
              {stats.totalClicks.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {t("shortlinks.clicks_word") || "klik"}
            </span>
          </div>
        </div>

        {/* Active Links */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("shortlinks.stat_active_links") || "Tautan Aktif"}
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-display font-black text-emerald-600 dark:text-emerald-400">
              {stats.activeLinks}
            </span>
          </div>
        </div>

        {/* Suspended Links */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("shortlinks.stat_suspended_links") || "Tautan Ditangguhkan"}
            </span>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <Ban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-display font-black text-rose-600 dark:text-rose-400">
              {stats.suspendedLinks}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t("shortlinks.search_ph") || "Cari tautan, slug, tujuan URL, atau pembuat..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-emerald-400/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.03]">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === "ALL"
                  ? "bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {t("shortlinks.status_all") || "Semua"} ({links.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === "ACTIVE"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
              }`}
            >
              {t("shortlinks.status_active") || "Aktif"} ({stats.activeLinks})
            </button>
            <button
              onClick={() => setStatusFilter("SUSPENDED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === "SUSPENDED"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
              }`}
            >
              {t("shortlinks.status_suspended") || "Ditangguhkan"} ({stats.suspendedLinks})
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.03] text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="NEWEST">{language === "id" ? "Terbaru" : "Newest"}</option>
              <option value="CLICKS">{language === "id" ? "Klik Terbanyak" : "Most Clicked"}</option>
              <option value="OLDEST">{language === "id" ? "Terlama" : "Oldest"}</option>
              <option value="NAME">{language === "id" ? "Nama Slug (A-Z)" : "Slug (A-Z)"}</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Links List / Table */}
      {filteredLinks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Link2 className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t("shortlinks.search_empty_title") || "Tautan Tidak Ditemukan"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {t("shortlinks.search_empty_desc") || "Tidak ada tautan yang cocok dengan kata kunci atau filter pencarian Anda."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredLinks.map((link) => {
            const isSuspended = link.isActive === false;

            return (
              <motion.div
                key={link.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-5 rounded-3xl bg-white dark:bg-[#07130e] border transition-all duration-300 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 hover:shadow-md ${
                  isSuspended
                    ? "border-rose-300/80 dark:border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/10"
                    : "border-slate-200 dark:border-white/10 hover:border-primary/40 dark:hover:border-emerald-400/40"
                }`}
              >
                {/* Left details */}
                <div className="flex-1 space-y-2.5 w-full">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                        isSuspended
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isSuspended ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
                      {isSuspended ? (t("shortlinks.status_suspended") || "Ditangguhkan") : (t("shortlinks.status_active") || "Aktif")}
                    </span>

                    {/* Slug */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1 rounded-full text-xs font-mono font-bold text-slate-900 dark:text-white">
                      <span className="text-slate-400">/s/</span>
                      <span className="text-primary dark:text-emerald-400">{link.slug}</span>
                    </div>

                    {/* Creator Department Badge */}
                    {link.departmentName && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 rounded-lg border border-slate-200/60 dark:border-white/5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {link.departmentName}
                      </span>
                    )}
                  </div>

                  {/* Description & URL */}
                  <div>
                    {link.description && (
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                        {link.description}
                      </h4>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono break-all line-clamp-1">
                      <Globe className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate max-w-xl">{link.originalUrl}</span>
                    </div>
                  </div>

                  {/* Creator Info & Date */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 border-t border-slate-100 dark:border-white/5">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{link.creatorName || link.creatorEmail || "Staff"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(link.createdAt)}</span>
                    </span>
                  </div>
                </div>

                {/* Right Analytics & Actions */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-white/5">
                  {/* Clicks Badge */}
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shrink-0">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {t("shortlinks.clicks") || "Klik"}
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                        {(link.clicks || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Copy Link */}
                    <button
                      onClick={() => handleCopy(link.slug, link.id)}
                      className={`p-2.5 rounded-2xl border transition-all duration-200 ${
                        copiedId === link.id
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                      }`}
                      title={t("shortlinks.copy_url") || "Salin Tautan"}
                    >
                      {copiedId === link.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>

                    {/* Test Original URL */}
                    <a
                      href={link.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
                      title="Buka URL Tujuan"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    {/* QR Code */}
                    <button
                      onClick={() => setQrModal({ isOpen: true, link })}
                      className="p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
                      title={t("shortlinks.view_qr") || "Lihat QR Code"}
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    {/* Toggle Suspend / Reactivate (RBAC: update) */}
                    {canUpdate && (
                      <button
                        onClick={() => setSuspendModal({ isOpen: true, link })}
                        className={`p-2.5 rounded-2xl border transition-all duration-200 ${
                          isSuspended
                            ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        }`}
                        title={isSuspended ? (t("shortlinks.toggle_activate") || "Aktifkan Tautan") : (t("shortlinks.toggle_suspend") || "Tangguhkan Tautan")}
                      >
                        {isSuspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>
                    )}

                    {/* Edit (RBAC: update) */}
                    {canUpdate && (
                      <button
                        onClick={() => handleOpenModal(link)}
                        className="p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
                        title={t("shortlinks.edit_tooltip") || "Edit Tautan"}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete (RBAC: delete) */}
                    {canDelete && (
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, link })}
                        className="p-2.5 rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all duration-200"
                        title={t("shortlinks.delete_tooltip") || "Hapus Tautan"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL: Create / Edit Shortlink ─── */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-display font-black text-slate-900 dark:text-white">
                  {editingId ? (t("shortlinks.edit_title") || "Edit Tautan Singkat") : (t("shortlinks.create_title") || "Buat Tautan Singkat Baru")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("shortlinks.modal_desc") || "Kustomisasi nama slug dan target destinasi URL resmi."}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Destination URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("shortlinks.dest_url_label") || "Target URL Asli (Destination URL) *"}
                </label>
                <input
                  type="url"
                  required
                  placeholder={t("shortlinks.url_ph") || "https://drive.google.com/... atau https://..."}
                  value={formData.originalUrl}
                  onChange={(e) => setFormData({ ...formData, originalUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-emerald-400"
                />
              </div>

              {/* Custom Slug */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t("shortlinks.custom_slug_label") || "Nama Slug Kustom *"}
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomSlug}
                    className="text-[11px] font-bold text-primary dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{t("shortlinks.generate") || "Acak Otomatis"}</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-sm font-mono font-bold text-slate-400 select-none">
                    /s/
                  </span>
                  <input
                    type="text"
                    required
                    pattern="^[a-zA-Z0-9-_]+$"
                    placeholder="nama-tautan-kustom"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })}
                    className="w-full pl-12 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] text-sm font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-emerald-400"
                  />
                  <div className="absolute right-3.5">
                    {isCheckingSlug ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    ) : isSlugAvailable === true ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : isSlugAvailable === false ? (
                      <X className="w-4 h-4 text-rose-500" />
                    ) : null}
                  </div>
                </div>
                {isSlugAvailable === false && (
                  <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                    {t("shortlinks.slug_taken") || "Slug ini sudah dipakai! Silakan ganti nama slug."}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("shortlinks.desc_label") || "Keterangan / Catatan Singkat"}
                </label>
                <input
                  type="text"
                  placeholder={t("shortlinks.desc_ph") || "Contoh: Dokumen SOP Administrasi Periode 2026"}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-emerald-400"
                />
              </div>

              {/* Status (Active / Suspended) */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {t("shortlinks.active_status") || "Status Aktif Tautan"}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {formData.isActive ? (language === "id" ? "Tautan aktif dan dapat diakses" : "Link is active and accessible") : (language === "id" ? "Tautan ditangguhkan/dinonaktifkan" : "Link is suspended")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                    formData.isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                      formData.isActive ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                >
                  {t("shortlinks.cancel") || "Batal"}
                </button>
                <button
                  type="submit"
                  disabled={loading || isSlugAvailable === false}
                  className="px-6 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white dark:text-slate-950 dark:bg-emerald-400 dark:hover:bg-emerald-300 font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingId ? (t("shortlinks.save_changes") || "Simpan Perubahan") : (t("shortlinks.create_link") || "Buat Tautan")}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>,
        document.body
      )}

      {/* ─── MODAL: Suspend / Activate Confirmation ─── */}
      {mounted && suspendModal.isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border ${
              suspendModal.link?.isActive === false
                ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                : "bg-amber-500/15 text-amber-500 border-amber-500/30"
            }`}>
              {suspendModal.link?.isActive === false ? (
                <CheckCircle className="w-7 h-7" />
              ) : (
                <AlertTriangle className="w-7 h-7" />
              )}
            </div>

            <h3 className="text-xl font-display font-black text-slate-900 dark:text-white">
              {suspendModal.link?.isActive === false
                ? (t("shortlinks.activate_confirm_title") || "Aktifkan Kembali Tautan?")
                : (t("shortlinks.suspend_confirm_title") || "Tangguhkan Tautan Ini?")}
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {suspendModal.link?.isActive === false
                ? (t("shortlinks.activate_confirm_desc", { slug: suspendModal.link?.slug }) || `Tautan /s/${suspendModal.link?.slug} akan kembali aktif dan dapat diakses publik.`)
                : (t("shortlinks.suspend_confirm_desc", { slug: suspendModal.link?.slug }) || `Tautan /s/${suspendModal.link?.slug} akan dinonaktifkan sementara dan menampilkan halaman peringatan kepada pengunjung.`)}
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setSuspendModal({ isOpen: false, link: null })}
                className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                {t("shortlinks.cancel") || "Batal"}
              </button>
              <button
                type="button"
                disabled={isTogglingStatus}
                onClick={handleToggleStatus}
                className={`px-6 py-2.5 rounded-2xl text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 ${
                  suspendModal.link?.isActive === false
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {isTogglingStatus && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {suspendModal.link?.isActive === false
                    ? (t("shortlinks.toggle_activate") || "Aktifkan")
                    : (t("shortlinks.toggle_suspend") || "Tangguhkan")}
                </span>
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* ─── MODAL: Delete Confirmation ─── */}
      {mounted && deleteModal.isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center"
          >
            <div className="w-14 h-14 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-display font-black text-slate-900 dark:text-white">
              {t("shortlinks.delete_modal_title") || "Hapus Tautan Permanen?"}
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {t("shortlinks.delete_modal_desc") || "Tindakan ini permanen. Tautan dan seluruh data analitik kliknya akan dihapus dari sistem."}
            </p>

            <div className="p-3 my-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold text-slate-800 dark:text-white">
              /s/{deleteModal.link?.slug}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, link: null })}
                className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                {t("shortlinks.cancel") || "Batal"}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{t("shortlinks.delete") || "Hapus"}</span>
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* ─── MODAL: QR Code ─── */}
      {mounted && qrModal.isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-black text-slate-900 dark:text-white">
                {t("shortlinks.qr_modal_title") || "QR Code Tautan"}
              </h3>
              <button
                onClick={() => setQrModal({ isOpen: false, link: null })}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {qrModal.link && (
              <div className="flex flex-col items-center">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-inner mb-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                      `${typeof window !== "undefined" ? window.location.origin : "https://sreupnjatim.com"}/s/${qrModal.link.slug}`
                    )}&margin=4`}
                    alt={`QR Code /s/${qrModal.link.slug}`}
                    className="w-48 h-48 block"
                  />
                </div>

                <div className="text-xs font-mono font-bold text-slate-800 dark:text-white mb-4">
                  /s/{qrModal.link.slug}
                </div>

                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={() => handleCopy(qrModal.link.slug, qrModal.link.id)}
                    className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t("shortlinks.copy_url_btn") || "Salin URL"}</span>
                  </button>

                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                      `${typeof window !== "undefined" ? window.location.origin : "https://sreupnjatim.com"}/s/${qrModal.link.slug}`
                    )}&margin=4`}
                    download={`qrcode-${qrModal.link.slug}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white dark:text-slate-950 dark:bg-emerald-400 dark:hover:bg-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{t("shortlinks.download_qr_btn") || "Unduh QR"}</span>
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}
