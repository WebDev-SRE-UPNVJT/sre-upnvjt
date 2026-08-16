import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, role, content, department, event, taskSubmission } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";

export async function GET() {
  const log = [];
  try {
    const email = "admin@sre.co.id";
    
    // Test Query 1: User details query
    log.push("Starting Query 1 (User details)...");
    const t0 = Date.now();
    const usersResult = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      departmentId: user.departmentId,
      roleName: role.name
    })
    .from(user)
    .leftJoin(role, eq(user.roleId, role.id))
    .where(eq(user.email, email))
    .limit(1);
    log.push(`Query 1 complete in ${Date.now() - t0}ms. Users found: ${usersResult.length}`);

    if (usersResult.length === 0) {
      return NextResponse.json({ success: false, error: "User not found", log });
    }

    const currentUser = {
      ...usersResult[0],
      role: { name: usersResult[0].roleName }
    };

    // Test Query 2: Stats - count users
    log.push("Starting Query 2 (Count active users)...");
    const t1 = Date.now();
    const [{ value: totalUsers }] = await db.select({ value: count() }).from(user).where(eq(user.isActive, true));
    log.push(`Query 2 complete in ${Date.now() - t1}ms. Total: ${totalUsers}`);

    // Test Query 3: Stats - count articles
    log.push("Starting Query 3 (Count published articles)...");
    const t2 = Date.now();
    const [{ value: publishedArticles }] = await db.select({ value: count() }).from(content).where(eq(content.isPublished, true));
    log.push(`Query 3 complete in ${Date.now() - t2}ms. Total: ${publishedArticles}`);

    // Test Query 4: Stats - count departments
    log.push("Starting Query 4 (Count departments)...");
    const t3 = Date.now();
    const [{ value: totalDepartments }] = await db.select({ value: count() }).from(department);
    log.push(`Query 4 complete in ${Date.now() - t3}ms. Total: ${totalDepartments}`);

    // Test Query 5: Stats - count events
    log.push("Starting Query 5 (Count events)...");
    const t4 = Date.now();
    const [{ value: totalActivities }] = await db.select({ value: count() }).from(event);
    log.push(`Query 5 complete in ${Date.now() - t4}ms. Total: ${totalActivities}`);

    // Test Query 6: Stats - recent articles
    log.push("Starting Query 6 (Recent articles)...");
    const t5 = Date.now();
    const recentArticles = await db.query.content.findMany({
      orderBy: [desc(content.createdAt)],
      limit: 5,
    });
    log.push(`Query 6 complete in ${Date.now() - t5}ms. Count: ${recentArticles.length}`);

    // Test Query 7: Stats - recent submissions
    log.push("Starting Query 7 (Recent task submissions)...");
    const t6 = Date.now();
    const recentSubmissions = await db.query.taskSubmission.findMany({
      orderBy: [desc(taskSubmission.submittedAt)],
      limit: 5,
      with: {
        member: { columns: { name: true } },
        task: { columns: { title: true } },
      },
    });
    log.push(`Query 7 complete in ${Date.now() - t6}ms. Count: ${recentSubmissions.length}`);

    // Test Query 8: Stats - content publish list for chart
    log.push("Starting Query 8 (Content list for chart)...");
    const t7 = Date.now();
    const publishedList = await db.query.content.findMany({
      where: eq(content.isPublished, true),
      columns: { createdAt: true },
    });
    log.push(`Query 8 complete in ${Date.now() - t7}ms. Count: ${publishedList.length}`);

    return NextResponse.json({
      success: true,
      message: "All dashboard queries tested successfully!",
      log,
      data: {
        totalUsers,
        publishedArticles,
        totalDepartments,
        totalActivities,
        recentArticlesCount: recentArticles.length,
        recentSubmissionsCount: recentSubmissions.length,
        publishedListCount: publishedList.length
      }
    });

  } catch (error) {
    log.push(`ERROR: ${error.message}`);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      log
    }, { status: 500 });
  }
}
