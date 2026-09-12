import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, passwordResetToken } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token dan password baru diperlukan." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    // Find a valid, unused, non-expired token
    const resetRecord = await db.query.passwordResetToken.findFirst({
      where: eq(passwordResetToken.token, token),
      with: { user: true },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Link reset password tidak valid atau sudah kadaluarsa." },
        { status: 400 }
      );
    }

    if (resetRecord.used) {
      return NextResponse.json(
        { error: "Link reset password ini sudah pernah digunakan." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(resetRecord.expiresAt)) {
      return NextResponse.json(
        { error: "Link reset password sudah kadaluarsa. Silakan minta link baru." },
        { status: 400 }
      );
    }

    if (!resetRecord.user || !resetRecord.user.isActive) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan atau tidak aktif." },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await db
      .update(user)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(user.id, resetRecord.userId));

    // Mark token as used
    await db
      .update(passwordResetToken)
      .set({ used: true })
      .where(eq(passwordResetToken.id, resetRecord.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  // Validate token only (no side effects) – used by reset-password page on load
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false, error: "Token tidak ditemukan." });
    }

    const resetRecord = await db.query.passwordResetToken.findFirst({
      where: eq(passwordResetToken.token, token),
    });

    if (!resetRecord) {
      return NextResponse.json({ valid: false, error: "Link tidak valid." });
    }

    if (resetRecord.used) {
      return NextResponse.json({ valid: false, error: "Link ini sudah pernah digunakan." });
    }

    if (new Date() > new Date(resetRecord.expiresAt)) {
      return NextResponse.json({ valid: false, error: "Link sudah kadaluarsa." });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    return NextResponse.json({ valid: false, error: "Terjadi kesalahan server." });
  }
}
