"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import { 
  User, 
  Lock, 
  Save, 
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Settings,
  Mail,
  BadgeIcon,
  Shield
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSession } from "next-auth/react";

export default function SettingsClient({ user }) {
  const { update } = useSession();
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState("profile");
  
  const [profileData, setProfileData] = useState({
    name: user.name || "",
    email: user.email || "",
    npm: user.npm || "",
    profilePictureUrl: user.profilePictureUrl || "",
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  // Crop Modal States
  const [imageToCrop, setImageToCrop] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCropModal = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageToCrop(reader.result);
        setIsCropModalOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropSave = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(
        imageToCrop,
        croppedAreaPixels,
        0
      );
      
      const croppedFile = new File([croppedImageBlob], "profile_cropped.jpg", { type: "image/jpeg" });
      setProfilePictureFile(croppedFile);
      setIsCropModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      let finalProfilePictureUrl = profileData.profilePictureUrl;

      // Upload file first if exists
      if (profilePictureFile) {
        const formData = new FormData();
        formData.append("file", profilePictureFile);
        formData.append("folder", "profiles");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload profile picture");
        }

        const uploadData = await uploadRes.json();
        finalProfilePictureUrl = uploadData.url;
      }

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profileData, profilePictureUrl: finalProfilePictureUrl }),
      });

      const data = await res.json();

      if (res.ok) {
        setProfileMessage({ type: "success", text: "Profile updated successfully!" });
        setProfileData(prev => ({ ...prev, profilePictureUrl: finalProfilePictureUrl }));
        setProfilePictureFile(null); // Clear selected file
        await update({ name: profileData.name }); // Update session name so dashboard reflects it immediately
        router.refresh();
      } else {
        setProfileMessage({ type: "error", text: data.error || "Failed to update profile." });
      }
    } catch (error) {
      console.error(error);
      setProfileMessage({ type: "error", text: error.message || "An unexpected error occurred." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsSavingPassword(true);
    setPasswordMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      setIsSavingPassword(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters." });
      setIsSavingPassword(false);
      return;
    }

    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPasswordMessage({ type: "success", text: "Password changed successfully!" });
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPasswordMessage({ type: "error", text: data.error || "Failed to change password." });
      }
    } catch (error) {
      setPasswordMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setIsSavingPassword(false);
    }
  };

  // System Settings Logic
  const [systemData, setSystemData] = useState({ APP_LANGUAGE: "en", APP_TITLE: "SRE UPNVJT Portal" });
  const [isSavingSystem, setIsSavingSystem] = useState(false);
  const [systemMessage, setSystemMessage] = useState(null);

  const fetchSystemSettings = async () => {
    try {
      const res = await fetch("/api/settings/system");
      const data = await res.json();
      if (!data.error) setSystemData((prev) => ({ ...prev, ...data }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user.roleName === "SUPER_ADMIN" && activeTab === "system") {
      fetchSystemSettings();
    }
  }, [user.roleName, activeTab]);

  const handleSystemSubmit = async (e) => {
    e.preventDefault();
    setIsSavingSystem(true);
    setSystemMessage(null);
    try {
      const res = await fetch("/api/settings/system", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(systemData)
      });
      const data = await res.json();
      if (data.success) {
        setSystemMessage({ type: "success", text: "System settings updated!" });
        if (systemData.APP_LANGUAGE) {
          setLanguage(systemData.APP_LANGUAGE); // trigger language change instantly
        }
      } else {
        setSystemMessage({ type: "error", text: data.error || "Failed" });
      }
    } catch (err) {
      setSystemMessage({ type: "error", text: "Error saving system settings" });
    }
    setIsSavingSystem(false);
  };

  return (
    <div className="w-full relative space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{t("settings.title")}</h1>
        <p className="text-gray-500 dark:text-white/60">{t("settings.subtitle")}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-3xl p-3 backdrop-blur-xl flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold tracking-wide transition-all ${
                activeTab === "profile" 
                  ? "bg-primary text-[#050e0a]" 
                  : "text-gray-500 dark:text-white/50 hover:text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              <User className="w-4 h-4" />
              {t("settings.profile_tab")}
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold tracking-wide transition-all ${
                activeTab === "password" 
                  ? "bg-primary text-[#050e0a]" 
                  : "text-gray-500 dark:text-white/50 hover:text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              <Lock className="w-4 h-4" />
              {t("settings.password_tab")}
            </button>
            {user.roleName === "SUPER_ADMIN" && (
              <button
                onClick={() => setActiveTab("system")}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold tracking-wide transition-all mt-4 border-t border-gray-200 dark:border-white/5 pt-4 ${
                  activeTab === "system" 
                    ? "bg-emerald-600 text-white" 
                    : "text-gray-500 dark:text-white/50 hover:text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                <Settings className="w-4 h-4" />
                {t("settings.system_tab")}
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl min-h-[500px]">
            <AnimatePresence mode="wait">
              
              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">{t("settings.profile_tab")}</h2>
                    <p className="text-gray-500 dark:text-white/50 text-sm">{t("settings.subtitle")}</p>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-2xl">
                    {/* Profile Picture Upload */}
                    <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-gray-200 dark:border-white/10">
                      <div className="relative group">
                        <div className="w-24 md:w-32 aspect-[3/4.5] rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 flex items-center justify-center shadow-md">
                          {profilePictureFile ? (
                            <img src={URL.createObjectURL(profilePictureFile)} alt="Preview" className="w-full h-full object-cover" />
                          ) : profileData.profilePictureUrl ? (
                            <img src={profileData.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-10 h-10 text-gray-400 dark:text-white/20" />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-center md:items-start gap-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t("settings.profile.photo_title")}</h3>
                        <p className="text-xs text-gray-500 dark:text-white/50 text-center md:text-left max-w-xs">
                          {t("settings.profile.photo_desc")}
                        </p>
                        <div className="mt-2">
                          <label className="cursor-pointer bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-900 dark:text-white px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-colors">
                            <span>{t("settings.profile.change_photo")}</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                showCropModal(e);
                                e.target.value = null; // reset input
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 font-bold">{t("settings.profile.full_name")}</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 dark:text-white/40">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={profileData.name}
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                            className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:bg-white/10 shadow-sm dark:shadow-none transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 font-bold">{t("settings.profile.email")}</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 dark:text-white/40">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            required
                            value={profileData.email}
                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                            className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:bg-white/10 shadow-sm dark:shadow-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 font-bold">{t("settings.profile.npm")}</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 dark:text-white/40">
                            <BadgeIcon className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            value={profileData.npm}
                            onChange={(e) => setProfileData({...profileData, npm: e.target.value})}
                            placeholder={t("settings.profile.npm_placeholder")}
                            className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:bg-white/10 shadow-sm dark:shadow-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>                    <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-2xl p-5 border border-gray-200 dark:border-white/10 mt-8">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" /> {t("settings.profile.role_info")}
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-white/40 uppercase tracking-wider mb-1">{t("settings.profile.current_role")}</p>
                          <span className="inline-block px-3 py-1 bg-primary/20 text-primary rounded-md text-xs font-bold tracking-widest uppercase border border-primary/30">
                            {user.roleName}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-white/40 uppercase tracking-wider mb-1">{t("settings.profile.department")}</p>
                          <p className="text-sm text-gray-900 dark:text-white font-medium">{user.departmentName}</p>
                        </div>
                      </div>
                    </div>

                    {profileMessage && (
                      <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${profileMessage.type === 'success' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {profileMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
                        {profileMessage.text}
                      </div>
                    )}

                    <div className="pt-4 flex justify-end border-t border-gray-200 dark:border-white/10">
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="bg-primary hover:bg-primary-focus text-[#050e0a] px-8 py-3 rounded-xl font-bold tracking-wide flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {t("settings.profile.save_changes")}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* PASSWORD TAB */}
              {activeTab === "password" && (
                <motion.div
                  key="password"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">{t("settings.password.title")}</h2>
                    <p className="text-gray-500 dark:text-white/50 text-sm">{t("settings.password.subtitle")}</p>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 font-bold">{t("settings.password.current")}</label>
                      <input
                        type="password"
                        required
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:bg-white/10 shadow-sm dark:shadow-none transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 font-bold">{t("settings.password.new")}</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:bg-white/10 shadow-sm dark:shadow-none transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 font-bold">{t("settings.password.confirm")}</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:bg-white/10 shadow-sm dark:shadow-none transition-colors"
                      />
                    </div>

                    {passwordMessage && (
                      <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${passwordMessage.type === 'success' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {passwordMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
                        {passwordMessage.text}
                      </div>
                    )}

                    <div className="pt-4 flex justify-end border-t border-gray-200 dark:border-white/10">
                      <button
                        type="submit"
                        disabled={isSavingPassword}
                        className="bg-primary hover:bg-primary-focus text-[#050e0a] px-8 py-3 rounded-xl font-bold tracking-wide flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {isSavingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                        {t("settings.password.update_btn")}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* SYSTEM TAB */}
              {user.roleName === "SUPER_ADMIN" && activeTab === "system" && (
                <motion.div
                  key="system"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">{t("settings.system.title")}</h2>
                    <p className="text-gray-500 dark:text-white/50 text-sm">{t("settings.system.subtitle")}</p>
                  </div>

                  <form onSubmit={handleSystemSubmit} className="space-y-6 max-w-md">
                    
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 font-bold">{t("settings.system.app_title")}</label>
                      <input
                        type="text"
                        required
                        value={systemData.APP_TITLE || ""}
                        onChange={(e) => setSystemData({...systemData, APP_TITLE: e.target.value})}
                        className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:bg-white/10 shadow-sm dark:shadow-none transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 font-bold">{t("settings.system.system_language")}</label>
                      <select
                        value={systemData.APP_LANGUAGE || "id"}
                        onChange={(e) => setSystemData({...systemData, APP_LANGUAGE: e.target.value})}
                        className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:bg-white/10 transition-colors"
                      >
                        <option value="id" className="text-black">Indonesian (ID)</option>
                        <option value="en" className="text-black">English (EN)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-white/50 font-bold">Public Self Registration</label>
                      <select
                        value={systemData.ENABLE_PUBLIC_REGISTRATION || "false"}
                        onChange={(e) => setSystemData({...systemData, ENABLE_PUBLIC_REGISTRATION: e.target.value})}
                        className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:bg-white/10 transition-colors"
                      >
                        <option value="false" className="text-black">Disabled</option>
                        <option value="true" className="text-black">Enabled</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-white/40">If enabled, anyone can create an account from the login page.</p>
                    </div>

                    {systemMessage && (
                      <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${systemMessage.type === 'success' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {systemMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
                        {systemMessage.text}
                      </div>
                    )}

                    <div className="pt-4 flex justify-end border-t border-gray-200 dark:border-white/10">
                      <button
                        type="submit"
                        disabled={isSavingSystem}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold tracking-wide flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {isSavingSystem ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {t("settings.system.apply_btn")}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      <AnimatePresence>
        {isCropModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden w-full max-w-lg flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-gray-200 dark:border-white/10 bg-white/[0.02]">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("settings.crop.title")}</h3>
              </div>
              <div className="relative w-full h-[400px] bg-black">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={3 / 4.5}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white/[0.02] flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500 font-bold uppercase">{t("settings.crop.zoom")}</span>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(e.target.value)}
                    className="flex-1 accent-primary"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsCropModalOpen(false);
                      setImageToCrop(null);
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {t("settings.crop.cancel")}
                  </button>
                  <button
                    onClick={handleCropSave}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-[#050e0a] hover:bg-primary-focus transition-colors"
                  >
                    {t("settings.crop.save")}
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
