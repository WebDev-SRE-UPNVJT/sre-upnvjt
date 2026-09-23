import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Sesi tidak valid atau telah berakhir. Silakan login kembali." }, { status: 401 });
    }

    const body = await req.json();
    const { newPassword, confirmPassword } = body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return NextResponse.json({ error: "Kata sandi baru minimal harus 6 karakter." }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Konfirmasi kata sandi tidak cocok." }, { status: 400 });
    }

    const userIdInt = parseInt(session.user.id);
    const foundUser = await db.query.user.findFirst({
      where: eq(user.id, userIdInt),
    });

    if (!foundUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

    await db.update(user).set({
      password: hashedPassword,
      mustChangePassword: false,
      updatedAt: new Date(),
    }).where(eq(user.id, userIdInt));

    return NextResponse.json({ 
      success: true, 
      message: "Kata sandi Anda berhasil diperbarui! Selamat datang di dashboard." 
    });
  } catch (error) {
    console.error("[first-password API] Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui kata sandi. Silakan coba lagi." }, { status: 500 });
  }
}
