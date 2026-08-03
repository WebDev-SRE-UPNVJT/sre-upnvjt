"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Shield, BookOpen, Layers, Award, Clock,
  UploadCloud, Settings, Edit2, X, CheckCircle2, XCircle,
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { notify("error", t("member_profile.err_image_only")); return; }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "profiles");
    setIsLoading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setProfileData(p => ({ ...p, profilePictureUrl: data.url }));
        notify("success", t("member_profile.upload_success"));
      } else {
        notify("error", data.error || t("member_profile.upload_fail"));
      }
    } catch {
      notify("error", t("member_profile.upload_error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (profileData.newPassword) {
      if (!profileData.currentPassword) {
        notify("error", t("member_profile.req_current_pwd"));
        return;
      }
      if (profileData.newPassword !== profileData.confirmPassword) {
        notify("error", t("member_profile.pwd_mismatch"));
        return;
      }
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
        notify("success", t("member_profile.save_success"));
        setModal(false);
        router.refresh();
      } else {
        notify("error", data.error || t("member_profile.save_fail"));
      }
    } catch {
      notify("error", t("member_profile.conn_error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full relative pb-10 min-h-[calc(100vh-80px)] flex flex-col">
      {/* Background Ambience */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

      {/* Profile Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 items-stretch relative z-10">
        
        {/* Main Gamified Profile Wrapper */}
        <div className="lg:col-span-2 relative rounded-3xl p-[2px] overflow-hidden group shadow-[0_20px_40px_rgba(16,185,129,0.05)] dark:shadow-[0_20px_40px_rgba(16,185,129,0.15)] transition-all">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/50 via-teal-500/50 to-emerald-500/50 bg-[length:200%_auto] animate-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="absolute inset-0 bg-slate-200 dark:bg-white/10 group-hover:opacity-0 transition-opacity duration-500" />
          
          <div className="relative h-full bg-white/95 dark:bg-[#08120e]/95 backdrop-blur-xl rounded-[1.4rem] p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 overflow-hidden transition-colors">
            {/* Gamified Background Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none mix-blend-overlay" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none transition-transform duration-1000 group-hover:scale-125" />

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
              {/* Hexagon Rank Badge Placeholder overlay */}
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-[#08120e] text-[10px] font-black px-3 py-1 rounded-full border-2 border-white dark:border-[#08120e] shadow-lg z-20 flex items-center gap-1 uppercase tracking-widest">
                <Star className="w-3 h-3" fill="currentColor" /> Lv {levelData.currentLevel}
              </div>
            </div>

            {/* User Bio Details */}
            <div className="flex-1 text-center md:text-left min-w-0 z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                      <Zap className="w-3 h-3" fill="currentColor" /> {t("member_profile.player_active")}
                    </span>
                  </div>
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
        <div className="relative rounded-3xl p-[2px] overflow-hidden group shadow-xl bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-emerald-500/30 dark:from-emerald-500/20 dark:via-teal-500/10 dark:to-emerald-500/20 border border-emerald-500/30 dark:border-emerald-500/30">
          <div className="relative h-full rounded-[1.4rem] p-6 backdrop-blur-xl flex flex-col justify-between bg-white/95 dark:bg-[#08120e]/95 text-slate-900 dark:text-white">
            {/* Hexagon Pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/honey_im_subtle.png')] opacity-10 pointer-events-none mix-blend-overlay" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-emerald-400/80">{t("member_profile.rank")}</span>
                <span className="text-[10px] font-black px-3.5 py-1.5 rounded-full border border-emerald-500/40 dark:border-emerald-400/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)] bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 backdrop-blur-md">
                  <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {levelData.levelName}
                </span>
              </div>
              <h2 className="text-4xl font-display font-black mb-1 drop-shadow-sm tracking-tighter text-emerald-600 dark:text-emerald-400">Lvl {levelData.currentLevel}</h2>
              <p className="text-[11px] font-bold leading-relaxed opacity-80 mt-1 uppercase tracking-wider text-slate-600 dark:text-emerald-200/80">
                {levelData.nextLevelXp ? `${t("member_profile.xp_to_next_pre")}${levelData.nextLevelXp - levelData.totalXp}${t("member_profile.xp_to_next_post")}` : t("member_profile.max_rank_reached")}
              </p>
            </div>

            <div className="mt-6 pt-4 relative z-10 border-t border-slate-200/80 dark:border-white/10">
              <div className="flex justify-between text-[10px] font-black uppercase mb-2 opacity-80 tracking-widest text-slate-600 dark:text-emerald-300/80">
                <span>{t("member_profile.total")} {levelData.totalXp} XP</span>
                <span>{levelData.nextLevelXp ? `${t("member_profile.next")} ${levelData.nextLevelXp} XP` : t("member_profile.max_level")}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-black/50 h-3 rounded-full overflow-hidden border border-emerald-500/30 shadow-inner relative p-[2px]">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000 relative overflow-hidden shadow-[0_0_12px_rgba(16,185,129,0.5)]" 
                  style={{ width: `${levelData.progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activities Split Grid - Gamified Combat Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative z-10">
        {/* Recent Quests (Tasks) */}
        <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 md:p-8 shadow-xl transition-colors relative overflow-hidden group/card">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] pointer-events-none group-hover/card:scale-150 transition-transform duration-700" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3 tracking-wide uppercase">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-500">
              <BookOpen className="w-5 h-5" />
            </div>
            {t("member_profile.task_log")}
          </h2>
          {recentTasks.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-white/[0.02]">
              <AlertTriangle className="w-8 h-8 text-slate-400 dark:text-gray-600 mb-2" />
              <p className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest">{t("member_profile.no_task")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map(tSub => (
                <div key={tSub.id} className="p-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl flex justify-between items-center gap-4 text-xs hover:border-blue-500/30 transition-colors">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-1 line-clamp-1">{tSub.task?.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(tSub.submittedAt).toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 shadow-sm ${
                    tSub.status === "APPROVED"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                      : tSub.status === "REJECTED"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                  }`}>
                    {tSub.status === "APPROVED" && <Check className="w-3 h-3" />}
                    {tSub.status === "REJECTED" && <X className="w-3 h-3" />}
                    {tSub.status === "PENDING" && <Clock className="w-3 h-3" />}
                    {tSub.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Battles (Quizzes) */}
        <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 md:p-8 shadow-xl transition-colors relative overflow-hidden group/card">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[50px] pointer-events-none group-hover/card:scale-150 transition-transform duration-700" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3 tracking-wide uppercase">
            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20 text-purple-500">
              <Layers className="w-5 h-5" />
            </div>
            {t("member_profile.quiz_battle")}
          </h2>
          {recentQuizzes.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-white/[0.02]">
              <AlertTriangle className="w-8 h-8 text-slate-400 dark:text-gray-600 mb-2" />
              <p className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest">{t("member_profile.no_quiz")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentQuizzes.map(qSub => (
                <div key={qSub.id} className="p-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs hover:border-purple-500/30 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-1 line-clamp-1 text-sm">{qSub.quiz?.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(qSub.submittedAt).toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-200/50 dark:bg-black/30 p-2 rounded-xl border border-slate-300 dark:border-white/5 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="font-black text-purple-600 dark:text-purple-400 text-sm tracking-tighter">
                      {t("member_profile.score")} <span className="text-slate-900 dark:text-white">{qSub.totalScore ?? qSub.mcqScore}</span>
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                      qSub.isPassed
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                        : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                    }`}>
                      {qSub.isPassed ? t("member_profile.success") : t("member_profile.failed")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(false)} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0a1612] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  {t("member_profile.edit_profile")}
                </h2>
                <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                <form id="editProfileForm" onSubmit={handleSaveProfile} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-white/50 uppercase mb-2">{t("member_profile.full_name")}</label>
                    <input type="text" required value={profileData.name}
                      onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))}
                      className="w-full h-12 px-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary/50 transition-colors" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-white/50 uppercase mb-2">{t("member_profile.primary_email")}</label>
                    <input type="email" disabled value={profileData.email}
                      className="w-full h-12 px-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-400 dark:text-white/50 cursor-not-allowed focus:outline-none" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-white/50 uppercase mb-2">{t("member_profile.npm")}</label>
                    <input type="text" required value={profileData.npm}
                      onChange={e => setProfileData(p => ({ ...p, npm: e.target.value }))}
                      className="w-full h-12 px-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary/50 transition-colors" />
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-white/5">
                    <label className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-white/50 uppercase mb-2">{t("member_profile.current_pwd")}</label>
                    <input type="password" value={profileData.currentPassword}
                      onChange={e => setProfileData(p => ({ ...p, currentPassword: e.target.value }))}
                      className="w-full h-12 px-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-slate-400 dark:placeholder:text-white/20" placeholder={t("member_profile.leave_blank")} />
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
