import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ─── Fetch personal tasks ───
    let personalTasks: any[] = [];
    try {
      personalTasks = await db.task.findMany({
        where: { userId },
        include: { category: true },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      });
    } catch (err) {
      console.error("Fetch personal tasks error:", err);
    }

    // ─── Fetch project tasks assigned to or created by this user ───
    let projectTasks: any[] = [];
    try {
      projectTasks = await db.projectTask.findMany({
        where: {
          OR: [
            { assigneeId: userId },
            { createdById: userId },
          ],
        },
        include: {
          assignee: { select: { id: true, username: true, name: true, avatar: true } },
          project: { select: { id: true, name: true, color: true, icon: true } },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      });
    } catch (err) {
      // If the OR query fails (e.g. createdById not synced to DB yet),
      // try fetching only by assigneeId as a fallback
      console.error("Fetch project tasks (OR) error, trying fallback:", err);
      try {
        projectTasks = await db.projectTask.findMany({
          where: { assigneeId: userId },
          include: {
            assignee: { select: { id: true, username: true, name: true, avatar: true } },
            project: { select: { id: true, name: true, color: true, icon: true } },
          },
          orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        });
      } catch (err2) {
        console.error("Fetch project tasks (fallback) error:", err2);
      }
    }

    // Also fetch project tasks where user is a project member
    // (covers tasks with no assignee in projects the user belongs to)
    let memberProjectTasks: any[] = [];
    try {
      const memberships = await db.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
      });
      const projectIds = memberships.map((m) => m.projectId);

      if (projectIds.length > 0) {
        // Get all tasks from user's projects that aren't already fetched
        const alreadyFetchedIds = new Set(projectTasks.map((t) => t.id));
        const allProjectTasks = await db.projectTask.findMany({
          where: { projectId: { in: projectIds } },
          include: {
            assignee: { select: { id: true, username: true, name: true, avatar: true } },
            project: { select: { id: true, name: true, color: true, icon: true } },
          },
          orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        });
        // Only add tasks not already in the list
        memberProjectTasks = allProjectTasks.filter((t) => !alreadyFetchedIds.has(t.id));
      }
    } catch (err) {
      console.error("Fetch member project tasks error:", err);
    }

    // Combine all project tasks (deduplicated)
    const allProjectTasks = [...projectTasks, ...memberProjectTasks];

    // ─── Normalize personal tasks with source tag ───
    const normalizedPersonal = personalTasks.map((t) => ({
      ...t,
      source: "personal" as const,
      projectId: null,
      projectName: null,
      projectColor: null,
    }));

    // ─── Normalize project tasks to match task list shape ───
    const normalizedProject = allProjectTasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      dueTime: t.dueTime,
      categoryId: null,
      category: null,
      tags: t.tags,
      isRecurring: t.isRecurring,
      recurRule: t.recurRule,
      completedAt: t.completedAt,
      folderName: t.folderName ?? null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      source: "project" as const,
      projectId: t.projectId,
      projectName: t.project?.name ?? "Unknown Project",
      projectColor: t.project?.color ?? "#6366f1",
    }));

    // ─── Merge and sort by due date, then created date ───
    const allTasks = [...normalizedPersonal, ...normalizedProject].sort((a, b) => {
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(allTasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      dueTime,
      categoryId,
      tags,
      isRecurring,
      recurRule,
      folderName,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const task = await db.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || "todo",
        priority: priority || "medium",
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        categoryId: categoryId || null,
        tags: tags || "",
        isRecurring: isRecurring || false,
        recurRule: recurRule || null,
        folderName: folderName?.trim() || null,
        userId,
      },
      include: { category: true },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
