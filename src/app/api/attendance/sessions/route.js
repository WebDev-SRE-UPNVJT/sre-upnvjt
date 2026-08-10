import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendanceSession } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const sessionUser = await getServerSession(authOptions);
    if (!sessionUser?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await db.query.attendanceSession.findMany({
      orderBy: [desc(attendanceSession.date)],
      with: {
        createdBy: { columns: { id: true, name: true } },
      },
    });
    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const sessionUser = await getServerSession(authOptions);
    if (!sessionUser?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, date, startTime, endTime, token, isActive = true } = body;

    if (!title || !date) {
      return NextResponse.json({ error: "Judul sesi dan tanggal wajib diisi" }, { status: 400 });
    }

    const [newSession] = await db.insert(attendanceSession).values({
      title,
      description: description || null,
      date: new Date(date),
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      token: token || null,
      isActive: Boolean(isActive),
      createdById: parseInt(sessionUser.user.id),
    }).returning();

    const fullSession = await db.query.attendanceSession.findFirst({
      where: eq(attendanceSession.id, newSession.id),
      with: {
        createdBy: { columns: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, session: fullSession }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
