import React from "react";
import { db } from "@/lib/db";
import { department } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/permissions";
import DepartmentsClient from "./DepartmentsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Departments & Divisions | SRE Portal",
};

export default async function DepartmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasAccess(session.user, "departments", "read")) {
    redirect("/dashboard?error=unauthorized");
  }

  const fetchedDepartments = await db.query.department.findMany({
    with: {
      divisions: true,
      users: { columns: { id: true } },
    },
    orderBy: [asc(department.name)],
  });

  const departments = fetchedDepartments.map((d) => {
    const { users, ...rest } = d;
    return {
      ...rest,
      _count: { users: users.length },
    };
  });

  return <DepartmentsClient initialDepartments={departments} />;
}
