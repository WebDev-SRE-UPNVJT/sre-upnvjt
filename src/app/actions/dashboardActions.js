"use server";

import { db } from "@/lib/db";
import {
  user,
  department,
  content,
  activity,
  task,
  taskSubmission,
  attendance,
  attendanceSession,
  announcement,
  literatureItem,
} from "@/db/schema";
import { eq, count, desc, gte, lt, and } from "drizzle-orm";
import { unstable_cache } from "next/cache";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function getEmptyStats(currentYear) {
  const defaultTrends = monthNames.map((name) => ({
    name,
    articles: 0,
    submissions: 0,
    attendances: 0,
  }));
  return {
    totalUsers: 0,
    totalLiterature: 0,
    publishedArticles: 0,
    totalDepartments: 0,
    totalActivities: 0,
    recentActivities: [],
    monthlyTrends: defaultTrends,
    currentYear,
    chartData: defaultTrends.map(() => 0),
    rawChartData: defaultTrends.map(() => 0),
    pendingAttendance: [],
  };
}

async function fetchDashboardStatsInternal() {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear + 1, 0, 1);

  try {
    // 1. Fetch High-level counts in parallel
    const countsPromise = Promise.allSettled([
      db.select({ value: count() }).from(user).where(eq(user.isActive, true)),
      db.select({ value: count() }).from(literatureItem),
      db.select({ value: count() }).from(department),
      db.select({ value: count() }).from(activity),
    ]);

    // 2. Fetch Recent Activities feeds
    const recentFeedsPromise = Promise.allSettled([
      db.query.content.findMany({
        orderBy: [desc(content.createdAt)],
        limit: 5,
        with: {
          updatedBy: { columns: { name: true } },
        },
      }),
      db.query.announcement.findMany({
        orderBy: [desc(announcement.createdAt)],
        limit: 5,
        with: {
          createdBy: { columns: { name: true } },
        },
      }),
      db.query.task.findMany({
        orderBy: [desc(task.createdAt)],
        limit: 5,
        with: {
          createdBy: { columns: { name: true } },
        },
      }),
      db.query.taskSubmission.findMany({
        orderBy: [desc(taskSubmission.submittedAt)],
        limit: 5,
        with: {
          member: { columns: { name: true } },
          task: { columns: { title: true } },
          reviewer: { columns: { name: true } },
        },
      }),
      db.query.attendanceSession.findMany({
        orderBy: [desc(attendanceSession.createdAt)],
        limit: 5,
        with: {
          createdBy: { columns: { name: true } },
        },
      }),
      db.query.activity.findMany({
        orderBy: [desc(activity.createdAt)],
        limit: 5,
      }),
    ]);

    // 3. Fetch Monthly trend data bounded to the current year
    const trendsPromise = Promise.allSettled([
      db.query.content.findMany({
        where: and(
          eq(content.isPublished, true),
          gte(content.createdAt, startOfYear),
          lt(content.createdAt, endOfYear)
        ),
        columns: { createdAt: true },
      }),
      db.query.taskSubmission.findMany({
        where: and(
          gte(taskSubmission.submittedAt, startOfYear),
          lt(taskSubmission.submittedAt, endOfYear)
        ),
        columns: { submittedAt: true },
      }),
      db.query.attendance.findMany({
        where: and(
          gte(attendance.createdAt, startOfYear),
          lt(attendance.createdAt, endOfYear)
        ),
        columns: { createdAt: true },
      }),
    ]);

    const [countsRes, recentFeedsRes, trendsRes] = await Promise.all([
      countsPromise,
      recentFeedsPromise,
      trendsPromise,
    ]);

    // Extract counts
    const totalUsers = countsRes[0].status === "fulfilled" ? countsRes[0].value[0]?.value || 0 : 0;
    const totalLiterature = countsRes[1].status === "fulfilled" ? countsRes[1].value[0]?.value || 0 : 0;
    const totalDepartments = countsRes[2].status === "fulfilled" ? countsRes[2].value[0]?.value || 0 : 0;
    const totalActivities = countsRes[3].status === "fulfilled" ? countsRes[3].value[0]?.value || 0 : 0;

    // Extract recent feeds
    const recentArticles = recentFeedsRes[0].status === "fulfilled" ? recentFeedsRes[0].value : [];
    const recentAnnouncements = recentFeedsRes[1].status === "fulfilled" ? recentFeedsRes[1].value : [];
    const recentTasks = recentFeedsRes[2].status === "fulfilled" ? recentFeedsRes[2].value : [];
    const recentSubmissions = recentFeedsRes[3].status === "fulfilled" ? recentFeedsRes[3].value : [];
    const recentSessions = recentFeedsRes[4].status === "fulfilled" ? recentFeedsRes[4].value : [];
    const recentActivitiesList = recentFeedsRes[5].status === "fulfilled" ? recentFeedsRes[5].value : [];

    // Extract trend data
    const publishedList = trendsRes[0].status === "fulfilled" ? trendsRes[0].value : [];
    const submissionsList = trendsRes[1].status === "fulfilled" ? trendsRes[1].value : [];
    const attendancesList = trendsRes[2].status === "fulfilled" ? trendsRes[2].value : [];

    // Format activities
    const formattedArticles = recentArticles.map((art) => ({
      id: `article-${art.id}`,
      title: art.title,
      desc: art.updatedBy?.name
        ? `Artikel diterbitkan oleh ${art.updatedBy.name} ke modul publik.`
        : "Artikel baru diterbitkan ke modul publik.",
      type: "ARTICLE",
      actor: art.updatedBy?.name || "Admin / Editor",
      date: art.createdAt,
    }));

    const formattedAnnouncements = recentAnnouncements.map((ann) => ({
      id: `announcement-${ann.id}`,
      title: ann.title,
      desc: ann.createdBy?.name
        ? `Pengumuman dirilis oleh ${ann.createdBy.name}${ann.targetAudience ? ` (Target: ${ann.targetAudience})` : ""}.`
        : "Pengumuman baru dirilis ke beranda sistem.",
      type: "ANNOUNCEMENT",
      actor: ann.createdBy?.name || "Admin",
      date: ann.createdAt,
    }));

    const formattedTasks = recentTasks.map((t) => ({
      id: `task-${t.id}`,
      title: t.title,
      desc: t.createdBy?.name
        ? `Penugasan baru dibuat oleh ${t.createdBy.name} (Reward: ${t.rewardXp || 0} XP).`
        : `Penugasan operasional baru (Reward: ${t.rewardXp || 0} XP).`,
      type: "TASK",
      actor: t.createdBy?.name || "Admin Divisi",
      date: t.createdAt,
    }));

    const formattedSubmissions = recentSubmissions.map((sub) => {
      const isReviewed = sub.status === "APPROVED" || sub.status === "REJECTED";
      if (isReviewed && sub.reviewer?.name) {
        return {
          id: `review-${sub.id}`,
          title: `Review Tugas: ${sub.task?.title || "Tugas"}`,
          desc: `${sub.reviewer.name} ${sub.status === "APPROVED" ? "menyetujui" : "menolak"} laporan milik ${sub.member?.name || "Anggota"}.`,
          type: "REVIEW",
          actor: sub.reviewer.name,
          date: sub.submittedAt,
        };
      }
      return {
        id: `submission-${sub.id}`,
        title: sub.task?.title || "Penugasan Operasional",
        desc: `Laporan solusi disubmit oleh ${sub.member?.name || "Anggota SRE"}.`,
        type: "SUBMISSION",
        actor: sub.member?.name || "Anggota",
        date: sub.submittedAt,
      };
    });

    const formattedSessions = recentSessions.map((sess) => ({
      id: `session-${sess.id}`,
      title: sess.title,
      desc: sess.createdBy?.name
        ? `Sesi absensi dibuka oleh ${sess.createdBy.name}.`
        : "Sesi presensi kegiatan dibuka.",
      type: "ATTENDANCE",
      actor: sess.createdBy?.name || "Admin",
      date: sess.createdAt,
    }));

    const formattedActivitiesList = recentActivitiesList.map((act) => ({
      id: `activity-${act.id}`,
      title: act.name,
      desc: `Aktivitas / kegiatan baru ditambahkan ke halaman Activities SRE.`,
      type: "EVENT",
      actor: "Admin Event",
      date: act.createdAt,
    }));

    const recentActivities = [
      ...formattedArticles,
      ...formattedAnnouncements,
      ...formattedTasks,
      ...formattedSubmissions,
      ...formattedSessions,
      ...formattedActivitiesList,
    ]
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Build 12-month trend data
    const monthlyTrends = monthNames.map((name) => ({
      name,
      articles: 0,
      submissions: 0,
      attendances: 0,
    }));

    publishedList.forEach((art) => {
      if (art.createdAt) {
        const d = new Date(art.createdAt);
        if (d.getFullYear() === currentYear) {
          const m = d.getMonth();
          if (monthlyTrends[m]) monthlyTrends[m].articles++;
        }
      }
    });

    submissionsList.forEach((sub) => {
      if (sub.submittedAt) {
        const d = new Date(sub.submittedAt);
        if (d.getFullYear() === currentYear) {
          const m = d.getMonth();
          if (monthlyTrends[m]) monthlyTrends[m].submissions++;
        }
      }
    });

    attendancesList.forEach((att) => {
      if (att.createdAt) {
        const d = new Date(att.createdAt);
        if (d.getFullYear() === currentYear) {
          const m = d.getMonth();
          if (monthlyTrends[m]) monthlyTrends[m].attendances++;
        }
      }
    });

    const chartData = monthlyTrends.map((m) => m.articles);

    const stats = {
      totalUsers,
      totalLiterature,
      publishedArticles: totalLiterature,
      totalDepartments,
      totalActivities,
      recentActivities,
      monthlyTrends,
      currentYear,
      chartData,
      rawChartData: chartData,
      pendingAttendance: [],
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("Error in fetchDashboardStatsInternal:", error);
    return { success: true, data: getEmptyStats(currentYear) };
  }
}

// Cache stats for 30 seconds to provide lightning fast responses and prevent connection spamming
const getCachedDashboardStats = unstable_cache(
  async () => {
    return await fetchDashboardStatsInternal();
  },
  ["admin-dashboard-stats-overview"],
  { revalidate: 30, tags: ["dashboard-stats"] }
);

export async function getDashboardStats(role, departmentId, userId) {
  try {
    return await getCachedDashboardStats();
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    const currentYear = new Date().getFullYear();
    return { success: true, data: getEmptyStats(currentYear) };
  }
}
