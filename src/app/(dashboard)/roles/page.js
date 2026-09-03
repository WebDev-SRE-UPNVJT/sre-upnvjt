"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Shield, X, Save } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

export const dynamic = "force-dynamic";

const availableModules = [
  // Core admin modules
  "users", "roles", "departments", "forms",
  "content", "merchandise", "shortlinks",
  // Operational modules (new)
  "tasks", "literature", "quiz", "ppt",
  "leaderboard", "attendance", "events", "activities",
];
const actions = ["create", "read", "update", "delete"];

export default function RolesManagementPage() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: "", permissions: {} });

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
    setIsModalOpen(true);
  };

  const handlePermissionChange = (module, action) => {
    const newPerms = { ...formData.permissions };
    if (!newPerms[module]) newPerms[module] = [];
    
    if (newPerms[module].includes(action)) {
      newPerms[module] = newPerms[module].filter(a => a !== action);
    } else {
      newPerms[module].push(action);
    }
    
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
        body: JSON.stringify(formData)
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
    if (!confirm(t("roles.delete_confirm"))) return;
    try {
      const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
      if (res.ok) fetchRoles();
    } catch (error) {
      console.error(error);
    }
  };

  if (session?.user?.roleName !== "SUPER_ADMIN") {
    return <div className="p-10 text-center text-red-500">{t("roles.access_denied")}</div>;
  }

  return (
    <div className="w-full relative">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            {t("roles.title")}
          </h1>
          <p className="text-gray-500 dark:text-white/50">{t("roles.subtitle")}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary-focus text-[#050e0a] px-6 py-3 rounded-xl font-bold tracking-wide flex items-center gap-2 transition-all hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          <Plus className="w-5 h-5" />
          {t("roles.create_btn")}
        </button>
      </div>

      {/* Roles Table */}
      <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
          <table className="w-full min-w-[800px] text-left">
          <thead className="border-b border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">{t("roles.table_name")}</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">{t("roles.table_users")}</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">{t("roles.table_perms")}</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 text-right">{t("roles.table_actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {loading ? (
              <tr><td colSpan="4" className="text-center py-10 text-gray-500 dark:text-white/30">{t("roles.loading")}</td></tr>
            ) : roles.map((role) => (
              <tr key={role.id} className="hover:bg-white/60 dark:hover:bg-white/[0.04] transition-colors group">
                <td className="px-6 py-4">
                  <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold tracking-widest uppercase ${role.name === 'SUPER_ADMIN' ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-white dark:bg-white/10 shadow-sm border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/80'}`}>
                    {role.name}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-white/70 font-medium">
                  {t("roles.users_count").replace("{count}", role._count?.users || 0)}
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-white/50 text-sm">
                  {Object.keys(role.permissions || {}).length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {Object.keys(role.permissions).map(mod => (
                        <span key={mod} className="text-[10px] uppercase bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 px-2 py-1 rounded">
                          {mod}: {t("roles.rules_count").replace("{count}", role.permissions[mod].length)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="italic">{t("roles.no_perms")}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => handleOpenModal(role)} className="p-2 text-gray-500 dark:text-white/40 hover:text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {role.name !== "SUPER_ADMIN" && (
                    <button onClick={() => handleDelete(role.id)} className="p-2 text-red-400/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-[#0a1f18] border border-gray-200 dark:border-white/10 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/[0.02]">
                <h2 className="text-xl font-display font-bold tracking-tight text-gray-900 dark:text-white">
                  {editingRole ? t("roles.modal_edit") : t("roles.modal_create")}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 dark:text-white/50 hover:text-gray-900 dark:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="mb-8">
                  <label className="block text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2 font-bold">{t("roles.table_name")}</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    disabled={editingRole?.name === "SUPER_ADMIN"}
                    className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary disabled:opacity-50"
                    placeholder={t("roles.placeholder_name")}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 mb-4 font-bold flex items-center gap-2">
                    <Shield className="w-4 h-4" /> {t("roles.granular_perms")}
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableModules.map(module => (
                      <div key={module} className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl p-4">
                        <h4 className="font-bold text-primary uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                          {module}
                        </h4>
                        <div className="flex gap-2 flex-wrap">
                          {actions.map(action => {
                            const isSelected = formData.permissions[module]?.includes(action);
                            return (
                              <button
                                key={action}
                                onClick={() => handlePermissionChange(module, action)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${isSelected ? 'bg-primary text-[#050e0a] shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-gray-50 dark:bg-white/5 shadow-sm border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                              >
                                {action}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold tracking-wide text-gray-500 dark:text-white/60 hover:text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/5 transition-colors">
                  {t("roles.cancel")}
                </button>
                <button onClick={handleSave} className="bg-primary hover:bg-primary-focus text-[#050e0a] px-6 py-2.5 rounded-xl font-bold tracking-wide flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <Save className="w-4 h-4" /> {t("roles.save_role")}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
