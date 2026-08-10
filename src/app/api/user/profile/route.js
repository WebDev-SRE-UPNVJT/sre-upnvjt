import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, npm, profilePictureUrl, currentPassword, newPassword } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const existingEmail = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existingEmail && existingEmail.id !== parseInt(session.user.id)) {
      return NextResponse.json({ error: "Email is already taken" }, { status: 400 });
    }

    const updateData = {};

    if (name) updateData.name = name;

    if (npm !== undefined) {
      if (npm) {
        const existingNpm = await db.query.user.findFirst({
          where: eq(user.npm, npm),
        });

        if (existingNpm && existingNpm.id !== parseInt(session.user.id)) {
          return NextResponse.json({ error: "NPM is already taken" }, { status: 400 });
        }
        updateData.npm = npm;
      }
    }

    if (profilePictureUrl !== undefined) {
      updateData.profilePictureUrl = profilePictureUrl;
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to set a new password" }, { status: 400 });
      }

      const currentUser = await db.query.user.findFirst({
        where: eq(user.id, parseInt(session.user.id)),
      });

      if (!currentUser || !currentUser.password) {
        return NextResponse.json({ error: "User not found or no password set" }, { status: 400 });
      }

      const isValid = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isValid) {
        return NextResponse.json({ error: "Password saat ini salah!" }, { status: 400 });
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    await db.update(user).set(updateData).where(eq(user.id, parseInt(session.user.id)));

    const updatedUser = await db.query.user.findFirst({
      where: eq(user.id, parseInt(session.user.id)),
      columns: {
        id: true,
        name: true,
        email: true,
        npm: true,
        profilePictureUrl: true,
      },
      with: {
        role: true,
        department: true,
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
