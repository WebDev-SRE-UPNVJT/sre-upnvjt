import { NextResponse } from "next/server";
import { getDashboardStats } from "@/app/actions/dashboardActions";

export async function GET() {
  try {
    console.log("Calling getDashboardStats directly...");
    const t0 = Date.now();
    const statsResponse = await getDashboardStats("SUPER_ADMIN", 1, 1);
    const duration = Date.now() - t0;
    
    return NextResponse.json({
      success: true,
      message: "getDashboardStats executed successfully!",
      duration: `${duration}ms`,
      statsResponse
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
