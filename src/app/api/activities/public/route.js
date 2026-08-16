import { NextResponse } from "next/server";
import { activityService } from "@/lib/services/activityService";

export async function GET() {
  try {
    const activities = await activityService.getAllActivities();
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching public activities:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
