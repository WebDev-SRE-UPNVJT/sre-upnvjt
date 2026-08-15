import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    console.log("Testing DB query on Vercel...");
    const res = await db.query.user.findFirst();
    console.log("Query complete!");
    
    return NextResponse.json({
      success: true,
      message: "Database query successful!",
      userFound: res ? { id: res.id, email: res.email } : "No user found"
    });
  } catch (error) {
    console.error("DB test failed:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
