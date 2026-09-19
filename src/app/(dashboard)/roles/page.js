"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Shield,
  X,
  Save,
  CheckSquare,
  Square,
  Eye,
  Trash,
  CheckCircle2,
  FolderLock,
  Layers,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  DASHBOARD_MODULE_CATEGORIES,
  ALL_AVAILABLE_MODULES,
  PERMISSION_ACTIONS,
} from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default function RolesManagementPage() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: "", permissions: {} });
  const [activeCategoryTab, setActiveCategoryTab] = useState("all");

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({ name: role.name, permissions: role.permissions || {} });
    } else {
      setEditingRole(null);
      setFormData({ name: "", permissions: {} });
    }
    setActiveCategoryTab("all");
    setIsModalOpen(true);
  };

  const handlePermissionChange = (module, action) => {
    const newPerms = { ...formData.permissions };
    if (!newPerms[module]) newPerms[module] = [];

    if (newPerms[module].includes(action)) {
      newPerms[module] = newPerms[module].filter((a) => a !== action);
      if (newPerms[module].length === 0) {
        delete newPerms[module];
      }
    } else {
      newPerms[module].push(action);
    }

    setFormData({ ...formData, permissions: newPerms });
  };

  // Bulk Actions
  const handleSelectAllGlobal = (mode = "all") => {
    const newPerms = {};
    ALL_AVAILABLE_MODULES.forEach((mod) => {
      if (mode === "all") {
        newPerms[mod] = [...PERMISSION_ACTIONS];
      } else if (mode === "read") {
        newPerms[mod] = ["read"];
      }
    });
    setFormData({ ...formData, permissions: mode === "clear" ? {} : newPerms });
  };

  const handleCategoryBulk = (categoryModules, mode = "all") => {
    const newPerms = { ...formData.permissions };
    categoryModules.forEach((m) => {
      if (mode === "all") {
        newPerms[m.id] = [...PERMISSION_ACTIONS];
      } else if (mode === "read") {
        newPerms[m.id] = ["read"];
      } else if (mode === "clear") {
        delete newPerms[m.id];
      }
    });
    setFormData({ ...formData, permissions: newPerms });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingRole ? `/api/roles/${editingRole.id}` : "/api/roles";
    const method = editingRole ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchRoles();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t("roles.delete_confirm") || "Yakin ingin menghapus role ini?")) return;
    try {
      const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
      if (res.ok) fetchRoles();
    } catch (error) {
      console.error(error);
    }
  };

  if (session?.user?.roleName !== "SUPER_ADMIN") {
    return (
      <div className="p-10 text-center text-red-500 font-bold">
        {t("roles.access_denied") || "Akses Ditolak: Hanya SUPER_ADMIN yang dapat mengelola Role & Permissions."}
      </div>
    );
  }

  // Count total configured actions for a role
  const getPermissionSummary = (permissions = {}) => {
    const modulesWithAccess = Object.keys(permissions).filter(
      (k) => Array.isArray(permissions[k]) && permissions[k].length > 0
    );
    return {
      moduleCount: modulesWithAccess.length,
      totalModules: ALL_AVAILABLE_MODULES.length,
    };
  };

  return (
    <div className="w-full relative space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            {t("roles.title") || "Roles & Dynamic Permissions"}
          </h1>
          <p className="text-gray-500 dark:text-white/50 text-sm">
            {t("roles.subtitle") ||
              "Kelola perizinan granular (RBAC) seluruh menu dashboard admin secara dinamis untuk setiap role."}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary-focus text-[#050e0a] px-6 py-3 rounded-xl font-bold tracking-wide flex items-center gap-2 transition-all hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0"
        >
          <Plus className="w-5 h-5" />
          {t("roles.create_btn") || "Tambah Role Baru"}
        </button>
      </div>

      {/* Roles Table */}
      <div className="bg-white/60 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-sm">
        <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
          <table className="w-full min-w-[750px] text-left">
            <thead className="border-b border-gray-200/80 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.02]">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">
                  {t("roles.table_name") || "Nama Role"}
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">
                  {t("roles.table_users") || "Pengguna"}
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">
                  {t("roles.table_perms") || "Akses Menu / Modul"}
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 text-right">
                  {t("roles.table_actions") || "Aksi"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-gray-500 dark:text-white/30">
                    {t("roles.loading") || "Memuat daftar role..."}
                  </td>
                </tr>
              ) : (
                roles.map((role) => {
                  const summary = getPermissionSummary(role.permissions);
                  const isSuper = role.name === "SUPER_ADMIN";

                  return (
                    <tr
                      key={role.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`inline-block px-3 py-1 rounded-md text-xs font-black tracking-widest uppercase ${
                              isSuper
                                ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                : "bg-white dark:bg-white/10 shadow-sm border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white/90"
                            }`}
                          >
                            {role.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-white/70 font-medium text-sm">
                        {(t("roles.users_count") || "{count} Pengguna").replace(
                          "{count}",
                          role._count?.users || 0
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Akses Penuh Semua Modul (God Mode)
                          </span>
                        ) : summary.moduleCount > 0 ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-700 dark:text-white/80">
                                {summary.moduleCount} dari {summary.totalModules} modul diizinkan
                              </span>
                            </div>
                            <div className="flex gap-1.5 flex-wrap max-w-xl">
                              {Object.keys(role.permissions || {}).map((mod) => (
                                <span
                                  key={mod}
                                  className="text-[10px] font-mono bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-0.5 rounded text-gray-600 dark:text-white/60"
                                >
                                  {mod} ({(role.permissions[mod] || []).join(",")})
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="italic text-xs text-gray-400 dark:text-white/30">
                            {t("roles.no_perms") || "Tidak ada izin modul"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => handleOpenModal(role)}
                            className="p-2 text-gray-500 dark:text-white/40 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                            title="Edit Role & Permissions"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!isSuper && (
                            <button
                              onClick={() => handleDelete(role.id)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Hapus Role"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Edit / Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="relative bg-white dark:bg-[#0a1f18] border border-gray-200 dark:border-white/10 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] z-10"
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-display font-black tracking-tight text-gray-900 dark:text-white">
                      {editingRole
                        ? t("roles.modal_edit") || "Konfigurasi Hak Akses Role"
                        : t("roles.modal_create") || "Buat Role Baru"}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-white/40">
                      Tentukan hak akses Create, Read, Update, Delete untuk tiap modul menu dashboard.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 space-y-6">
                {/* Role Name */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2 font-bold">
                    {t("roles.table_name") || "Nama Role"}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={editingRole?.name === "SUPER_ADMIN"}
                    className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary disabled:opacity-50 text-sm font-semibold"
                    placeholder={t("roles.placeholder_name") || "Contoh: PENGURUS_BPH, MEMBER_ACARA"}
                  />
                  {editingRole?.name === "SUPER_ADMIN" && (
                    <p className="text-xs text-amber-500 mt-1.5 font-medium">
                      Nama role SUPER_ADMIN tidak dapat diubah karena merupakan role master sistem.
                    </p>
                  )}
                </div>

                {/* Global Quick Action Toolbar */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/70 block">
                      Aksi Cepat Hak Akses
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-white/40">
                      Terapkan perizinan sekaligus ke seluruh {ALL_AVAILABLE_MODULES.length} modul dashboard.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelectAllGlobal("all")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-slate-950 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all"
                    >
                      Pilih Semua (Full CRUD)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAllGlobal("read")}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white dark:text-blue-400 border border-blue-500/20 text-xs font-bold transition-all"
                    >
                      Lihat Saja (Read Only)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAllGlobal("clear")}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-all"
                    >
                      Kosongkan Semua
                    </button>
                  </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setActiveCategoryTab("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      activeCategoryTab === "all"
                        ? "bg-primary text-[#050e0a] shadow-sm"
                        : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200"
                    }`}
                  >
                    Semua Kategori ({ALL_AVAILABLE_MODULES.length})
                  </button>
                  {DASHBOARD_MODULE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategoryTab(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                        activeCategoryTab === cat.id
                          ? "bg-primary text-[#050e0a] shadow-sm"
                          : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200"
                      }`}
                    >
                      {cat.name} ({cat.modules.length})
                    </button>
                  ))}
                </div>

                {/* Categorized Module Permissions List */}
                <div className="space-y-6">
                  {DASHBOARD_MODULE_CATEGORIES.filter(
                    (cat) => activeCategoryTab === "all" || activeCategoryTab === cat.id
                  ).map((category) => (
                    <div
                      key={category.id}
                      className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-white/[0.01]"
                    >
                      {/* Category Header Bar */}
                      <div className="px-4 py-3 bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-primary" />
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                            {category.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCategoryBulk(category.modules, "all")}
                            className="px-2 py-1 rounded bg-slate-200/60 dark:bg-white/10 hover:bg-emerald-500 hover:text-slate-950 text-[10px] font-bold text-slate-600 dark:text-white/70 transition-colors"
                          >
                            Pilih Semua
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCategoryBulk(category.modules, "read")}
                            className="px-2 py-1 rounded bg-slate-200/60 dark:bg-white/10 hover:bg-blue-500 hover:text-white text-[10px] font-bold text-slate-600 dark:text-white/70 transition-colors"
                          >
                            Read Only
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCategoryBulk(category.modules, "clear")}
                            className="px-2 py-1 rounded bg-slate-200/60 dark:bg-white/10 hover:bg-rose-500 hover:text-white text-[10px] font-bold text-slate-600 dark:text-white/70 transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Modules Grid */}
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {category.modules.map((mod) => {
                          const perms = formData.permissions[mod.id] || [];
                          const isFullyGranted =
                            PERMISSION_ACTIONS.every((act) => perms.includes(act));

                          return (
                            <div
                              key={mod.id}
                              className={`p-3.5 rounded-xl border transition-all ${
                                perms.length > 0
                                  ? "bg-emerald-500/[0.02] border-emerald-500/30"
                                  : "bg-slate-50/40 dark:bg-white/[0.01] border-slate-200 dark:border-white/5"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                      {mod.label}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400 dark:text-white/30">
                                      `{mod.id}`
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 dark:text-white/40 mt-0.5 leading-snug">
                                    {mod.desc}
                                  </p>
                                </div>
                              </div>

                              {/* CRUD Action Buttons */}
                              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-white/5">
                                {PERMISSION_ACTIONS.map((action) => {
                                  const isSelected = perms.includes(action);
                                  return (
                                    <button
                                      key={action}
                                      type="button"
                                      onClick={() => handlePermissionChange(mod.id, action)}
                                      className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase transition-all flex items-center gap-1 ${
                                        isSelected
                                          ? "bg-emerald-500 text-slate-950 shadow-sm"
                                          : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10"
                                      }`}
                                    >
                                      {isSelected && <CheckSquare className="w-3 h-3" />}
                                      {action}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] flex justify-between items-center shrink-0">
                <span className="text-xs text-slate-400 dark:text-white/40 font-medium hidden sm:inline">
                  {Object.keys(formData.permissions).length} modul dikonfigurasi
                </span>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide text-gray-500 dark:text-white/60 hover:text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/5 transition-colors"
                  >
                    {t("roles.cancel") || "Batal"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="bg-primary hover:bg-primary-focus text-[#050e0a] px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02]"
                  >
                    <Save className="w-4 h-4" /> {t("roles.save_role") || "Simpan Perizinan"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
