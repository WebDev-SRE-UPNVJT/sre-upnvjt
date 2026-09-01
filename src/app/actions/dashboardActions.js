"use server";

import { db } from "@/lib/db";
import {
  user,
  department,
  activity,
  literatureItem,
} from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { unstable_cache } from "next/cache";

async function fetchDashboardStatsInternal() {
  try {
    const [usersRes, literatureRes, deptsRes, activitiesRes] = await Promise.allSettled([
      db.select({ value: count() }).from(user).where(eq(user.isActive, true)),
      db.select({ value: count() }).from(literatureItem),
      db.select({ value: count() }).from(department),
      db.select({ value: count() }).from(activity),
    ]);

    const totalUsers = usersRes.status === "fulfilled" ? usersRes.value[0]?.value || 0 : 0;
    const totalLiterature = literatureRes.status === "fulfilled" ? literatureRes.value[0]?.value || 0 : 0;
    const totalDepartments = deptsRes.status === "fulfilled" ? deptsRes.value[0]?.value || 0 : 0;
    const totalActivities = activitiesRes.status === "fulfilled" ? activitiesRes.value[0]?.value || 0 : 0;

    return {
      success: true,
      data: {
        totalUsers,
        totalLiterature,
        publishedArticles: totalLiterature,
        totalDepartments,
        totalActivities,
      },
    };
  } catch (error) {
    console.error("Error in fetchDashboardStatsInternal:", error);
    return {
      success: true,
      data: {
        totalUsers: 0,
        totalLiterature: 0,
        publishedArticles: 0,
        totalDepartments: 0,
        totalActivities: 0,
      },
    };
  }
}

// Cache stats for 60 seconds to provide lightning fast responses
const getCachedDashboardStats = unstable_cache(
  async () => {
    return await fetchDashboardStatsInternal();
  },
  ["admin-dashboard-stats-overview-fast"],
  { revalidate: 60, tags: ["dashboard-stats"] }
);

export async function getDashboardStats() {
  try {
    return await getCachedDashboardStats();
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      success: true,
      data: {
        totalUsers: 0,
        totalLiterature: 0,
        publishedArticles: 0,
        totalDepartments: 0,
        totalActivities: 0,
      },
    };
  }
}
