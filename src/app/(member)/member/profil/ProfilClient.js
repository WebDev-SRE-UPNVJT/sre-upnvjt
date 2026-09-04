"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Shield, BookOpen, Layers, Award, Clock,
  Settings, Edit2, X, CheckCircle2, XCircle,
  ExternalLink, FileText, Check, AlertTriangle, Zap, Star
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getUserLevelData } from "@/lib/leveling";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function ProfilClient({ user, recentTasks, recentQuizzes }) {
  const router = useRouter();
  const { t } = useLanguage();

  const [profileData, setProfileData] = useState({
    name: user.name || "",
    email: user.email || "",
    npm: user.npm || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [notification, setNotification] = useState(null);

  const xp = user.xp || 0;
  const levelData = getUserLevelData(xp);

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      notify("error", t("member_profile.err_pwd_mismatch"));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();

      if (res.ok) {
        notify("success", t("member_profile.update_success"));
        setModal(false);
        router.refresh();
      } else {
        notify("error", data.error || t("member_profile.update_fail"));
      }
    } catch {
      notify("error", t("member_profile.update_error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Dynamic Profile Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-2xl flex items-center justify-between border ${
          notification.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-semibold">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/10 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Profile Header Banner - Glassmorphism & Cyber Aesthetics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative rounded-3xl p-6 md:p-8 bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 overflow-hidden shadow-xl dark:shadow-2xl">
          {/* Ambient light glow behind avatar */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">

            {/* Profile Picture */}
            <div className="relative shrink-0 select-none z-10 group/avatar">
              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-md opacity-20 group-hover/avatar:opacity-50 transition-opacity duration-500 animate-pulse" />
              {profileData.profilePictureUrl ? (
                <img src={profileData.profilePictureUrl} alt="" className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] relative z-10 group-hover/avatar:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-emerald-500/10 flex items-center justify-center border-4 border-emerald-500 text-4xl font-black text-emerald-500 relative z-10 shadow-[0_0_30px_rgba(16,185,129,0.3)] group-hover/avatar:scale-105 transition-transform duration-500">
                  {profileData.name?.charAt(0)}
                </div>
              )}
            </div>

            {/* User Bio Details */}
            <div className="flex-1 text-center md:text-left min-w-0 z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-white/70">{profileData.name}</h1>
                  <p className="text-xs text-slate-500 dark:text-emerald-400/80 font-bold mt-1 tracking-wider uppercase">{profileData.email}</p>
                </div>
                <button
                  onClick={() => setModal(true)}
                  className="relative group/btn flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10 flex items-center gap-2"><Edit2 className="w-3.5 h-3.5" /> {t("member_profile.configure")}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-5 border-t border-slate-200 dark:border-white/10 text-xs mt-2">
              <div>
                <span className="text-[9px] text-slate-400 dark:text-emerald-500/60 font-black uppercase tracking-widest block mb-1">{t("member_profile.identity_npm")}</span>
                <span className="font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/5 px-2 py-1 rounded inline-block">{profileData.npm || t("member_profile.unknown")}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 dark:text-emerald-500/60 font-black uppercase tracking-widest block mb-1">{t("member_profile.class_role")}</span>
                <span className="font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/5 px-2 py-1 rounded inline-block capitalize">{user.positionName || user.roleName?.replace("_", " ")}</span>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Level & Badge Gamified Card */}
        <div className="relative rounded-3xl p-6 bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 shadow-xl">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/honey_im_subtle.png')] opacity-10 pointer-events-none mix-blend-overlay" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-emerald-400/80">{t("member_profile.rank")}</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">{levelData.levelName}</span>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
                  {xp}
                </span>
                <span className="text-xs font-bold text-slate-400 dark:text-white/40">XP</span>
              </div>

              {/* Enhanced Progress Bar */}
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-white/60">
                  <span>{t("member_profile.progress_lvl", { level: levelData.currentLevel + 1 })}</span>
                  <span className="font-mono text-emerald-500">{levelData.progressPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 h-2.5 rounded-full overflow-hidden p-[1px]">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.5)]" 
                    style={{ width: `${levelData.progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 dark:text-white/30 font-medium pt-1">
                  <span>{t("member_profile.cur_tier")}</span>
                  <span>{levelData.nextLevelXp ? `${levelData.nextLevelXp - xp} XP to Next` : t("member_profile.max_tier")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Grid: 2 Columns: Activity Feeds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Recent Tasks Card */}
        <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-none">{t("member_profile.recent_submissions")}</h3>
                  <p className="text-xs text-slate-500 dark:text-white/40 mt-1">{t("member_profile.task_history_desc")}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/60">
                {recentTasks?.length || 0} {t("member_profile.unit_tasks")}
              </span>
            </div>

            <div className="space-y-3">
              {recentTasks && recentTasks.length > 0 ? (
                recentTasks.map((tItem, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{tItem.task?.title || "Tugas SRE"}</p>
                      <span className="text-[10px] text-slate-400 dark:text-white/40 block mt-0.5 font-medium">
                        {new Date(tItem.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      tItem.status === "APPROVED" 
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                        : tItem.status === "REJECTED"
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}>
                      {tItem.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-white/20 mb-2" />
                  <p className="text-xs text-slate-400 dark:text-white/40 font-medium">{t("member_profile.no_submissions")}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Quizzes Card */}
        <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-none">{t("member_profile.recent_quizzes")}</h3>
                  <p className="text-xs text-slate-500 dark:text-white/40 mt-1">{t("member_profile.quiz_history_desc")}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/60">
                {recentQuizzes?.length || 0} {t("member_profile.unit_quizzes")}
              </span>
            </div>

            <div className="space-y-3">
              {recentQuizzes && recentQuizzes.length > 0 ? (
                recentQuizzes.map((qItem, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{qItem.quiz?.title || "Quiz Akademik"}</p>
                      <span className="text-[10px] text-slate-400 dark:text-white/40 block mt-0.5 font-medium">
                        {new Date(qItem.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-amber-500 block">
                        {qItem.score} Pts
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-white/30 font-bold">
                        +{qItem.rewardXp} XP
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Star className="w-8 h-8 mx-auto text-slate-300 dark:text-white/20 mb-2" />
                  <p className="text-xs text-slate-400 dark:text-white/40 font-medium">{t("member_profile.no_quizzes")}</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{t("member_profile.edit_title")}</h3>
                  <p className="text-xs text-slate-500 dark:text-white/50">{t("member_profile.edit_desc")}</p>
                </div>
                <button onClick={() => setModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <form id="editProfileForm" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-white/50 uppercase mb-2">{t("member_profile.fullname")}</label>
                    <input type="text" value={profileData.name} required
                      onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))}
                      className="w-full h-12 px-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary/50 transition-colors" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-white/50 uppercase">{t("member_profile.email")}</label>
                      <span className="text-[10px] text-slate-400 dark:text-white/40 font-medium">{t("member_profile.email_readonly")}</span>
                    </div>
                    <input type="email" value={profileData.email} disabled readOnly
                      className="w-full h-12 px-4 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl text-sm text-slate-500 dark:text-white/40 cursor-not-allowed select-none focus:outline-none" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-white/50 uppercase mb-2">{t("member_profile.identity_npm")}</label>
                    <input type="text" value={profileData.npm}
                      onChange={e => setProfileData(p => ({ ...p, npm: e.target.value }))}
                      className="w-full h-12 px-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary/50 transition-colors" />
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-4">
                    <p className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">{t("member_profile.change_pwd_section")}</p>
                    
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-white/50 uppercase mb-2">{t("member_profile.cur_pwd")}</label>
                      <input type="password" value={profileData.currentPassword}
                        onChange={e => setProfileData(p => ({ ...p, currentPassword: e.target.value }))}
                        className="w-full h-12 px-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary/50 transition-colors" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-white/50 uppercase mb-2">{t("member_profile.new_pwd")}</label>
                        <input type="password" value={profileData.newPassword}
                          onChange={e => setProfileData(p => ({ ...p, newPassword: e.target.value }))}
                          className="w-full h-12 px-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary/50 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-white/50 uppercase mb-2">{t("member_profile.confirm_pwd")}</label>
                        <input type="password" value={profileData.confirmPassword}
                          onChange={e => setProfileData(p => ({ ...p, confirmPassword: e.target.value }))}
                          className="w-full h-12 px-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary/50 transition-colors" />
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-white/5 flex justify-end gap-3 bg-slate-50 dark:bg-white/[0.02]">
                <button type="button" onClick={() => setModal(false)} className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-white/70 dark:hover:bg-white/10">{t("member_profile.cancel")}</button>
                <button type="submit" form="editProfileForm" disabled={isLoading}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-[#050e0a] hover:bg-primary-focus flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : t("member_profile.save")}
                </button>
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
