import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, passwordResetToken } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendEmail } from "@/lib/email";
import { getPasswordResetEmailHtml } from "@/lib/emailTemplates";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const foundUser = await db.query.user.findFirst({
      where: eq(user.email, email.trim().toLowerCase()),
    });

    // Always return success to prevent user enumeration attacks
    if (!foundUser) {
      return NextResponse.json({ success: true });
    }

    if (!foundUser.isActive) {
      return NextResponse.json({ success: true });
    }

    // Generate a secure random token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Delete any existing tokens for this user
    await db
      .delete(passwordResetToken)
      .where(eq(passwordResetToken.userId, foundUser.id));

    // Insert new token
    await db.insert(passwordResetToken).values({
      userId: foundUser.id,
      token,
      expiresAt,
      used: false,
    });

    // Build the reset URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send the email
    await sendEmail({
      to: foundUser.email,
      subject: "Reset Password Akun SRE UPNVJT",
      html: getPasswordResetEmailHtml({
        name: foundUser.name,
        resetUrl,
        expiryMinutes: 60,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
