import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendance, attendanceSession, user, memberProfile, xpTransaction } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const records = await db.query.attendance.findMany({
      with: {
        member: { columns: { id: true, name: true, npm: true } },
        session: true,
      },
      orderBy: [desc(attendance.createdAt)],
    });

    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, status, notes, token } = body;
    const memberIdInt = parseInt(session.user.id);

    if (!sessionId || !status) {
      return NextResponse.json({ error: "Sesi dan status absensi wajib diisi" }, { status: 400 });
    }

    // Check if the session exists
    const sessionRecord = await db.query.attendanceSession.findFirst({
      where: eq(attendanceSession.id, parseInt(sessionId)),
    });

    if (!sessionRecord) {
      return NextResponse.json({ error: "Sesi presensi tidak ditemukan" }, { status: 404 });
    }

    // Check if user already submitted
    const existing = await db.query.attendance.findFirst({
      where: and(
        eq(attendance.sessionId, parseInt(sessionId)),
        eq(attendance.memberId, memberIdInt)
      )
    });

    if (existing) {
      return NextResponse.json({ error: "Anda sudah mengisi presensi untuk sesi ini" }, { status: 400 });
    }

    // Validate Token if status is PRESENT
    if (status === "PRESENT") {
      if (sessionRecord.token) {
        if (!token || token.trim() !== sessionRecord.token) {
          return NextResponse.json({ error: "Token presensi tidak valid!" }, { status: 403 });
        }
      }
    }

    // If status is ABSENT or EXCUSED, maybe notes is required, but let's just save it.

    const [result] = await db.insert(attendance).values({
      sessionId: parseInt(sessionId),
      memberId: memberIdInt,
      status,
      notes: notes || null,
    }).returning();

    // Give 10 XP if PRESENT or LATE
    if (status === "PRESENT" || status === "LATE") {
      const userRoleRecord = await db.query.user.findFirst({
        where: eq(user.id, memberIdInt),
        with: { role: true }
      });

      // Prevent Staff/Admin from gaining XP, only MEMBER gets XP
      if (userRoleRecord && userRoleRecord.role?.name?.toUpperCase() === "MEMBER") {
        const xpAmount = 10;
        
        // 1. Update legacy totalPoints
        await db.update(user)
          .set({ totalPoints: sql`${user.totalPoints} + ${xpAmount}` })
          .where(eq(user.id, memberIdInt));

        // 2. Upsert memberProfile
        await db.insert(memberProfile)
          .values({
            userId: memberIdInt,
            xp: xpAmount,
            level: 1,
          })
          .onConflictDoUpdate({
            target: memberProfile.userId,
            set: { xp: sql`${memberProfile.xp} + ${xpAmount}` }
          });

        // 3. Log XP transaction
        await db.insert(xpTransaction).values({
          userId: memberIdInt,
          amount: xpAmount,
          reason: status === "PRESENT" ? "Presensi (Hadir)" : "Presensi (Terlambat)",
          sourceType: "attendance",
          sourceId: result.id,
        });
      }
    }

    // fetch relation for return value
    const full = await db.query.attendance.findFirst({
      where: eq(attendance.id, result.id),
      with: { 
        member: { columns: { id: true, name: true, npm: true } },
        session: true
      },
    });

    return NextResponse.json({ success: true, attendance: full }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
