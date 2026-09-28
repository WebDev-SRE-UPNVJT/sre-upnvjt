import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, systemSetting, role } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    // 1. Check if public registration is enabled
    const setting = await db.query.systemSetting.findFirst({
      where: eq(systemSetting.keyName, "ENABLE_PUBLIC_REGISTRATION"),
    });

    if (!setting || setting.valueData !== "true") {
      return NextResponse.json(
        { error: "Public registration is currently disabled by the administrator." },
        { status: 403 }
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const { name, email, npm, password, roleId, departmentId, divisionId } = body;

    if (!name || !email || !password || !roleId) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Security: ensure the selected role is not SUPER_ADMIN
    const selectedRole = await db.query.role.findFirst({
      where: eq(role.id, Number(roleId))
    });
    
    if (!selectedRole || selectedRole.name === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Invalid or unauthorized role selection." },
        { status: 400 }
      );
    }

    // 3. Check if email already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Insert new user
    await db.insert(user).values({
      name,
      email,
      npm: npm || null,
      password: hashedPassword,
      roleId: Number(roleId),
      departmentId: departmentId ? Number(departmentId) : null,
      divisionId: divisionId ? Number(divisionId) : null,
      isActive: true, // Assuming auto-activate. Change to false if manual approval is needed.
    });

    return NextResponse.json({ success: true, message: "User registered successfully." });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
