import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";
import { user, role } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ authenticated: false, message: "No session found" });
  }

  let usersResult = null;
  let error = null;

  try {
    usersResult = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      departmentId: user.departmentId,
      roleName: role.name
    })
    .from(user)
    .leftJoin(role, eq(user.roleId, role.id))
    .where(eq(user.email, session.user?.email || ""))
    .limit(1);
  } catch (err) {
    error = err.message;
  }

  return NextResponse.json({
    authenticated: true,
    session,
    userEmailInSession: session.user?.email || "NOT_FOUND",
    usersResult,
    error
  });
}
