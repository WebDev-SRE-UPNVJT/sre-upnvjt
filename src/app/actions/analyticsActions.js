"use server";

import { db } from "@/lib/db";
import { pageView } from "@/db/schema";
import { count, countDistinct, desc, sql, isNotNull, gte } from "drizzle-orm";

// 4 Stat Cards Summary
export async function getVisitorStats() {
  try {
    const [totalViews] = await db
      .select({ value: count() })
      .from(pageView);

    const [uniqueVisitors] = await db
      .select({ value: countDistinct(pageView.visitorId) })
      .from(pageView);

    const [loggedInVisitors] = await db
      .select({ value: countDistinct(pageView.userId) })
      .from(pageView)
      .where(isNotNull(pageView.userId));

    // Most visited path
    const topPathResult = await db
      .select({
        path: pageView.path,
        visits: count(),
      })
      .from(pageView)
      .groupBy(pageView.path)
      .orderBy(desc(count()))
      .limit(1);

    return {
      success: true,
      data: {
        totalViews: Number(totalViews?.value || 0),
        uniqueVisitors: Number(uniqueVisitors?.value || 0),
        loggedInVisitors: Number(loggedInVisitors?.value || 0),
        topPage: topPathResult[0]?.path ?? "-",
      },
    };
  } catch (err) {
    console.error("[analytics] getVisitorStats:", err.message);
    return { success: false, error: err.message };
  }
}

// Daily traffic for the last N days
export async function getDailyTraffic(days = 14) {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const dayExpr = sql`to_char(${pageView.createdAt}, 'YYYY-MM-DD')`;

    const rows = await db
      .select({
        date: sql`${dayExpr}`.as("date"),
        visits: count(),
      })
      .from(pageView)
      .where(gte(pageView.createdAt, since))
      .groupBy(dayExpr)
      .orderBy(dayExpr);

    // Fill missing days with 0 so chart has no gaps
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const isoDate = d.toISOString().slice(0, 10);

      const found = rows.find((r) => r.date === isoDate);

      result.push({ date: label, visits: found ? Number(found.visits) : 0 });
    }

    return { success: true, data: result };
  } catch (err) {
    console.error("[analytics] getDailyTraffic:", err.message);
    return { success: false, error: err.message };
  }
}

// Hourly traffic distribution (0-23)
export async function getHourlyTraffic() {
  try {
    const hourExpr = sql`EXTRACT(HOUR FROM ${pageView.createdAt})::int`;

    const rows = await db
      .select({
        hour: sql`${hourExpr}`.as("hour"),
        visits: count(),
      })
      .from(pageView)
      .groupBy(hourExpr)
      .orderBy(hourExpr);

    // Ensure all 24 hours exist
    const result = Array.from({ length: 24 }, (_, i) => {
      const found = rows.find((r) => Number(r.hour) === i);
      const hourLabel = `${String(i).padStart(2, "0")}:00`;
      return { hour: hourLabel, visits: found ? Number(found.visits) : 0 };
    });

    return { success: true, data: result };
  } catch (err) {
    console.error("[analytics] getHourlyTraffic:", err.message);
    return { success: false, error: err.message };
  }
}

// Device breakdown
export async function getDeviceBreakdown() {
  try {
    const rows = await db
      .select({
        device: pageView.deviceType,
        visits: count(),
      })
      .from(pageView)
      .groupBy(pageView.deviceType)
      .orderBy(desc(count()));

    return {
      success: true,
      data: rows.map((r) => ({
        device: r.device ?? "unknown",
        visits: Number(r.visits),
      })),
    };
  } catch (err) {
    console.error("[analytics] getDeviceBreakdown:", err.message);
    return { success: false, error: err.message };
  }
}

// Top N pages by page view count
export async function getTopPages(limit = 5) {
  try {
    const rows = await db
      .select({
        path: pageView.path,
        visits: count(),
      })
      .from(pageView)
      .groupBy(pageView.path)
      .orderBy(desc(count()))
      .limit(limit);

    return {
      success: true,
      data: rows.map((r) => ({ path: r.path, visits: Number(r.visits) })),
    };
  } catch (err) {
    console.error("[analytics] getTopPages:", err.message);
    return { success: false, error: err.message };
  }
}
