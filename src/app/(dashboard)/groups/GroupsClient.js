"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UsersRound,
  Plus,
  Search,
  Edit2,
  Trash2,
  UserPlus,
  UserCheck,
  Crown,
  UserMinus,
  CheckCircle2,
  X,
  Save,
  Users,
  Grid,
  List,
  GraduationCap,
  Layers,
} from "lucide-react";
import { hasAccess } from "@/lib/permissions";
import {
  createMentorGroup,
  updateMentorGroup,
  deleteMentorGroup,
  assignMembersToGroup,
  removeMemberFromGroup,
  toggleMemberLeaderRole,
} from "@/app/actions/mentorGroupActions";

export default function GroupsClient({ initialGroups = [], allUsers = [], currentUser }) {
  const [groups, setGroups] = useState(initialGroups);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  // Modal States
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [rosterGroup, setRosterGroup] = useState(null);

  // Form State for Group (Clean: name, code, mentorId, coMentorId, isActive)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    mentorId: "",
    coMentorId: "",
    isActive: true,
  });

  // State for Add Member to Roster Modal
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");
  const [selectedUserIdsToAdd, setSelectedUserIdsToAdd] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // RBAC Access
  const canCreate = hasAccess(currentUser, "groups", "create");
  const canUpdate = hasAccess(currentUser, "groups", "update");
  const canDelete = hasAccess(currentUser, "groups", "delete");

  // Distinct departments for member search
  const departments = useMemo(() => {
    const dMap = new Map();
    allUsers.forEach((u) => {
      if (u.department) {
        dMap.set(u.department.id, u.department.name);
      }
    });
    return Array.from(dMap.entries()).map(([id, name]) => ({ id, name }));
  }, [allUsers]);

  // Filter only users with role MENTOR (case-insensitive)
  const mentorUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const roleName = (u.role?.name || "").toUpperCase();
      return roleName.includes("MENTOR");
    });
  }, [allUsers]);

  // Filtered groups by search
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      return (
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.code && g.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (g.mentor?.name && g.mentor.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [groups, searchQuery]);

  // Overall statistics
  const totalMembersAssigned = useMemo(() => {
    let count = 0;
    groups.forEach((g) => {
      count += (g.members || []).length;
    });
    return count;
  }, [groups]);

  const totalMentorsAssigned = useMemo(() => {
    const mSet = new Set();
    groups.forEach((g) => {
      if (g.mentorId) mSet.add(g.mentorId);
      if (g.coMentorId) mSet.add(g.coMentorId);
    });
    return mSet.size;
  }, [groups]);

  // Group Create/Edit Handlers
  const handleOpenGroupModal = (grp = null) => {
    if (grp) {
      setEditingGroup(grp);
      setFormData({
        name: grp.name || "",
        code: grp.code || "",
        mentorId: grp.mentorId ? String(grp.mentorId) : "",
        coMentorId: grp.coMentorId ? String(grp.coMentorId) : "",
        isActive: grp.isActive !== undefined ? grp.isActive : true,
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: "",
        code: `GRP-${groups.length + 1 < 10 ? "0" : ""}${groups.length + 1}`,
        mentorId: "",
        coMentorId: "",
        isActive: true,
      });
    }
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingGroup) {
        const res = await updateMentorGroup(editingGroup.id, formData);
        if (res.success) {
          setGroups((prev) =>
            prev.map((g) =>
              g.id === editingGroup.id
                ? {
                    ...g,
                    ...res.data,
                    mentor: allUsers.find((u) => u.id === parseInt(formData.mentorId)) || null,
                    coMentor: allUsers.find((u) => u.id === parseInt(formData.coMentorId)) || null,
                  }
                : g
            )
          );
          setIsGroupModalOpen(false);
        } else {
          alert(res.error || "Gagal memperbarui kelompok.");
        }
      } else {
        const res = await createMentorGroup(formData);
        if (res.success) {
          const created = {
            ...res.data,
            mentor: allUsers.find((u) => u.id === parseInt(formData.mentorId)) || null,
            coMentor: allUsers.find((u) => u.id === parseInt(formData.coMentorId)) || null,
            members: [],
          };
          setGroups([created, ...groups]);
          setIsGroupModalOpen(false);
        } else {
          alert(res.error || "Gagal membuat kelompok.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!confirm("Yakin ingin menghapus kelompok mentoring ini?")) return;
    try {
      const res = await deleteMentorGroup(id);
      if (res.success) {
        setGroups((prev) => prev.filter((g) => g.id !== id));
      } else {
        alert(res.error || "Gagal menghapus kelompok.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Member Roster Handlers
  const handleOpenRoster = (grp) => {
    setRosterGroup(grp);
    setSelectedUserIdsToAdd([]);
    setMemberSearch("");
    setSelectedDeptFilter("all");
    setIsRosterModalOpen(true);
  };

  // Available users not yet in this group (Filtered strictly to role MEMBER)
  const availableUsersToAdd = useMemo(() => {
    if (!rosterGroup) return [];
    const currentMemberIds = new Set((rosterGroup.members || []).map((m) => m.userId));
    if (rosterGroup.mentorId) currentMemberIds.add(rosterGroup.mentorId);
    if (rosterGroup.coMentorId) currentMemberIds.add(rosterGroup.coMentorId);

    return allUsers.filter((u) => {
      if (currentMemberIds.has(u.id)) return false;

      // Only show users with role MEMBER
      const roleName = (u.role?.name || "").toUpperCase();
      if (!roleName.includes("MEMBER")) return false;

      const matchSearch =
        u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        (u.npm && u.npm.toLowerCase().includes(memberSearch.toLowerCase())) ||
        u.email.toLowerCase().includes(memberSearch.toLowerCase());
      const matchDept =
        selectedDeptFilter === "all" ||
        (u.department && String(u.department.id) === String(selectedDeptFilter));
      return matchSearch && matchDept;
    });
  }, [allUsers, rosterGroup, memberSearch, selectedDeptFilter]);

  const handleToggleSelectUser = (uid) => {
    setSelectedUserIdsToAdd((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleAddMembersToRoster = async () => {
    if (!rosterGroup || selectedUserIdsToAdd.length === 0) return;
    setIsSaving(true);
    try {
      const res = await assignMembersToGroup(rosterGroup.id, selectedUserIdsToAdd);
      if (res.success) {
        const newlyAdded = selectedUserIdsToAdd.map((uid) => ({
          id: Date.now() + Math.random(),
          groupId: rosterGroup.id,
          userId: uid,
          role: "MEMBER",
          joinedAt: new Date(),
          user: allUsers.find((u) => u.id === uid),
        }));

        const updatedMembers = [...(rosterGroup.members || []), ...newlyAdded];
        const updatedRosterGroup = { ...rosterGroup, members: updatedMembers };

        setRosterGroup(updatedRosterGroup);
        setGroups((prev) =>
          prev.map((g) => (g.id === rosterGroup.id ? updatedRosterGroup : g))
        );
        setSelectedUserIdsToAdd([]);
      } else {
        alert(res.error || "Gagal menambahkan anggota.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!rosterGroup) return;
    try {
      const res = await removeMemberFromGroup(rosterGroup.id, userId);
      if (res.success) {
        const updatedMembers = (rosterGroup.members || []).filter(
          (m) => m.userId !== userId
        );
        const updatedRosterGroup = { ...rosterGroup, members: updatedMembers };

        setRosterGroup(updatedRosterGroup);
        setGroups((prev) =>
          prev.map((g) => (g.id === rosterGroup.id ? updatedRosterGroup : g))
        );
      } else {
        alert(res.error || "Gagal menghapus anggota.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleLeader = async (userId, currentRole) => {
    if (!rosterGroup) return;
    const isNowLeader = currentRole !== "LEADER";
    try {
      const res = await toggleMemberLeaderRole(rosterGroup.id, userId, isNowLeader);
      if (res.success) {
        const updatedMembers = (rosterGroup.members || []).map((m) =>
          m.userId === userId ? { ...m, role: isNowLeader ? "LEADER" : "MEMBER" } : m
        );
        const updatedRosterGroup = { ...rosterGroup, members: updatedMembers };

        setRosterGroup(updatedRosterGroup);
        setGroups((prev) =>
          prev.map((g) => (g.id === rosterGroup.id ? updatedRosterGroup : g))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full space-y-6 select-none">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <UsersRound className="w-3 h-3" />
              Kelompok & Mentoring
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-slate-900 dark:text-white">
            Kelompok Mentoring
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-white/50 mt-1 max-w-xl">
            Kelola pembagian kelompok mentoring, tetapkan Mentor & Co-Mentor pendamping, dan atur anggota tiap kelompok.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => handleOpenGroupModal()}
            className="px-5 py-3 rounded-xl bg-primary hover:bg-primary-focus text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:scale-105 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Kelompok Baru</span>
          </button>
        )}
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">
              Total Kelompok
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {groups.length}
          </div>
        </div>

        <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">
              Mentor Ditugaskan
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {totalMentorsAssigned}
          </div>
        </div>

        <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">
              Anggota Terdaftar
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {totalMembersAssigned}
          </div>
        </div>

        <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">
              Rata-rata Anggota
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <UsersRound className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {groups.length > 0 ? (totalMembersAssigned / groups.length).toFixed(1) : 0}
          </div>
        </div>
      </div>

      {/* ── Toolbar: Search & View Toggle ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-xl p-3 shadow-sm">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kelompok, kode, atau mentor..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg border text-xs font-bold transition-all ${
              viewMode === "grid"
                ? "bg-primary text-slate-950 border-primary shadow-sm"
                : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"
            }`}
            title="Tampilan Grid Kartu"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`p-2 rounded-lg border text-xs font-bold transition-all ${
              viewMode === "table"
                ? "bg-primary text-slate-950 border-primary shadow-sm"
                : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"
            }`}
            title="Tampilan Tabel"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Groups Content (Grid or Table) ─────────────────────────── */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto mb-3">
            <UsersRound className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Belum ada kelompok mentoring
          </h3>
          <p className="text-xs text-slate-400 dark:text-white/40 max-w-sm mx-auto mt-1">
            Buat kelompok mentoring pertama Anda untuk membagi anggota ke dalam tim dengan mentor pendamping.
          </p>
          {canCreate && (
            <button
              onClick={() => handleOpenGroupModal()}
              className="mt-4 px-4 py-2 rounded-xl bg-primary hover:bg-primary-focus text-slate-950 font-black text-xs tracking-wider uppercase inline-flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Buat Kelompok Sekarang
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const members = group.members || [];
            const leader = members.find((m) => m.role === "LEADER");

            return (
              <div
                key={group.id}
                className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Code, Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {group.code && (
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white/80 font-mono font-black text-[10px]">
                          {group.code}
                        </span>
                      )}
                    </div>

                    <span
                      className={`w-2 h-2 rounded-full ${
                        group.isActive ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                      title={group.isActive ? "Aktif" : "Nonaktif"}
                    />
                  </div>

                  {/* Group Name */}
                  <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {group.name}
                  </h3>

                  {/* Mentor & Co-Mentor Section */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-500 text-xs shrink-0">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                          Mentor Utama
                        </span>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {group.mentor?.name || "Belum Ditentukan"}
                        </p>
                      </div>
                    </div>

                    {group.coMentor && (
                      <div className="flex items-center gap-2.5 pt-2 border-t border-slate-200/50 dark:border-white/5">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-blue-500 text-xs shrink-0">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                            Co-Mentor
                          </span>
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {group.coMentor.name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Members Summary */}
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600 dark:text-white/60">
                      Anggota: <span className="text-slate-900 dark:text-white font-black">{members.length} Orang</span>
                    </span>
                    {leader && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Crown className="w-3 h-3 fill-current" />
                        Ketua: {leader.user?.name?.split(" ")[0]}
                      </span>
                    )}
                  </div>

                  {/* Member Avatars preview */}
                  {members.length > 0 && (
                    <div className="flex items-center -space-x-2 overflow-hidden mt-2 pt-1">
                      {members.slice(0, 6).map((m) => (
                        <div
                          key={m.id}
                          className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/10 border-2 border-white dark:border-[#08120e] flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-white/80 shrink-0"
                          title={m.user?.name}
                        >
                          {m.user?.profilePictureUrl ? (
                            <img
                              src={m.user.profilePictureUrl}
                              alt=""
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            m.user?.name?.charAt(0).toUpperCase() || "?"
                          )}
                        </div>
                      ))}
                      {members.length > 6 && (
                        <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-white/20 border-2 border-white dark:border-[#08120e] flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                          +{members.length - 6}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenRoster(group)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-emerald-500 dark:bg-white/10 dark:hover:bg-emerald-400 text-white dark:hover:text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Kelola Anggota ({members.length})</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {canUpdate && (
                      <button
                        onClick={() => handleOpenGroupModal(group)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                        title="Edit Kelompok"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Hapus Kelompok"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left min-w-[650px]">
              <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-4">Kode & Kelompok</th>
                  <th className="p-4">Mentor Utama</th>
                  <th className="p-4">Co-Mentor</th>
                  <th className="p-4 text-center">Anggota</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {filteredGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {group.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {group.code || "-"}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-white/90">
                        {group.mentor?.name || "-"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {group.mentor?.department?.name || ""}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-white/90">
                        {group.coMentor?.name || "-"}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 font-bold font-mono">
                        {(group.members || []).length} Orang
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenRoster(group)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-500 dark:bg-white/10 text-white dark:hover:text-slate-950 font-bold text-[10px] uppercase transition-all"
                        >
                          Anggota
                        </button>
                        {canUpdate && (
                          <button
                            onClick={() => handleOpenGroupModal(group)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteGroup(group.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal Create / Edit Group (Clean & Compact) ────────────── */}
      <AnimatePresence>
        {isGroupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGroupModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-[#0a1f18] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] z-10"
            >
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <UsersRound className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-display font-black text-slate-900 dark:text-white">
                    {editingGroup ? "Edit Kelompok Mentoring" : "Buat Kelompok Mentoring Baru"}
                  </h2>
                </div>
                <button
                  onClick={() => setIsGroupModalOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveGroup} className="p-5 sm:p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50 mb-1.5">
                      Nama Kelompok *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Kelompok 1 - Renewable Alpha"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50 mb-1.5">
                      Kode Kelompok
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="GRP-01"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mentor Utama */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">
                        Mentor Utama
                      </label>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Role: MENTOR ({mentorUsers.length})
                      </span>
                    </div>
                    <select
                      value={formData.mentorId}
                      onChange={(e) => setFormData({ ...formData, mentorId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                    >
                      <option value="">-- Pilih Mentor --</option>
                      {mentorUsers.length > 0 ? (
                        mentorUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role?.name || "MENTOR"}{u.department ? ` - ${u.department.name}` : ""})
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          (Belum ada user dengan role MENTOR - Atur di menu Users)
                        </option>
                      )}
                      {mentorUsers.length === 0 && (
                        <optgroup label="User Lainnya (Non-Mentor)">
                          {allUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.role?.name || "Member"}{u.department ? ` - ${u.department.name}` : ""})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* Co-Mentor */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">
                        Co-Mentor (Opsional)
                      </label>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        Role: MENTOR
                      </span>
                    </div>
                    <select
                      value={formData.coMentorId}
                      onChange={(e) => setFormData({ ...formData, coMentorId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                    >
                      <option value="">-- Tidak ada Co-Mentor --</option>
                      {mentorUsers
                        .filter((u) => String(u.id) !== String(formData.mentorId))
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role?.name || "MENTOR"}{u.department ? ` - ${u.department.name}` : ""})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsGroupModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-focus text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? "Menyimpan..." : "Simpan Kelompok"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal Roster Anggota (Member Management) ───────────────── */}
      <AnimatePresence>
        {isRosterModalOpen && rosterGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRosterModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-[#0a1f18] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] z-10"
            >
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px]">
                      {rosterGroup.code || "GROUP"}
                    </span>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      Roster Anggota: {rosterGroup.name}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
                    Mentor: {rosterGroup.mentor?.name || "Belum ada"} | Total: {(rosterGroup.members || []).length} Anggota
                  </p>
                </div>
                <button
                  onClick={() => setIsRosterModalOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Roster Body */}
              <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Left Column: Current Members ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      Anggota Saat Ini ({(rosterGroup.members || []).length})
                    </h4>
                  </div>

                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {(rosterGroup.members || []).length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                        <Users className="w-8 h-8 text-slate-300 dark:text-white/20 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-400">
                          Belum ada anggota di kelompok ini.
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Gunakan panel sebelah kanan untuk menambahkan anggota.
                        </p>
                      </div>
                    ) : (
                      (rosterGroup.members || []).map((m) => {
                        const isLeader = m.role === "LEADER";
                        return (
                          <div
                            key={m.userId}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                              isLeader
                                ? "bg-amber-500/[0.04] border-amber-500/30"
                                : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-white shrink-0 overflow-hidden">
                                {m.user?.profilePictureUrl ? (
                                  <img src={m.user.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  m.user?.name?.charAt(0).toUpperCase() || "?"
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {m.user?.name}
                                  </p>
                                  {isLeader && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5">
                                      <Crown className="w-2.5 h-2.5" /> Ketua
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {m.user?.npm || m.user?.email} {m.user?.department?.name ? `• ${m.user.department.name}` : ""}
                                </p>
                              </div>
                            </div>

                            {/* Action: Toggle Leader & Remove */}
                            {canUpdate && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleLeader(m.userId, m.role)}
                                  className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    isLeader
                                      ? "bg-amber-500 text-slate-950"
                                      : "text-slate-400 hover:text-amber-500 hover:bg-amber-500/10"
                                  }`}
                                  title={isLeader ? "Batalkan Ketua Kelompok" : "Jadikan Ketua Kelompok"}
                                >
                                  <Crown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(m.userId)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                  title="Keluarkan dari Kelompok"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* ── Right Column: Add Members Search ── */}
                <div className="space-y-3 lg:border-l lg:border-slate-200 lg:dark:border-white/10 lg:pl-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-primary" />
                      Tambah Anggota Baru
                    </h4>
                    {selectedUserIdsToAdd.length > 0 && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedUserIdsToAdd.length} Dipilih
                      </span>
                    )}
                  </div>

                  {/* Search and Dept Filter */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        placeholder="Cari nama anggota atau NPM..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                      />
                    </div>

                    {departments.length > 0 && (
                      <select
                        value={selectedDeptFilter}
                        onChange={(e) => setSelectedDeptFilter(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-white/70 focus:outline-none focus:border-primary"
                      >
                        <option value="all">Semua Departemen</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Available Users List */}
                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1 border border-slate-200 dark:border-white/10 rounded-xl p-2 bg-slate-50/50 dark:bg-white/[0.01]">
                    {availableUsersToAdd.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-6">
                        Tidak ada anggota yang ditemukan.
                      </p>
                    ) : (
                      availableUsersToAdd.map((u) => {
                        const isSelected = selectedUserIdsToAdd.includes(u.id);
                        return (
                          <div
                            key={u.id}
                            onClick={() => handleToggleSelectUser(u.id)}
                            className={`p-2 rounded-lg cursor-pointer flex items-center justify-between gap-2 transition-all ${
                              isSelected
                                ? "bg-emerald-500/15 border border-emerald-500/30 text-slate-900 dark:text-white"
                                : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-white/80"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate">{u.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {u.npm || u.email} {u.department ? `• ${u.department.name}` : ""}
                              </p>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                                isSelected
                                  ? "bg-emerald-500 border-emerald-500 text-slate-950"
                                  : "border-slate-300 dark:border-white/20"
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Selected Button */}
                  {canUpdate && (
                    <button
                      type="button"
                      disabled={selectedUserIdsToAdd.length === 0 || isSaving}
                      onClick={handleAddMembersToRoster}
                      className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-focus disabled:opacity-40 disabled:hover:bg-primary text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>
                        {isSaving
                          ? "Menambahkan..."
                          : `Tambahkan ${selectedUserIdsToAdd.length} Anggota Terpilih`}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Roster Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsRosterModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white/10 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors"
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
