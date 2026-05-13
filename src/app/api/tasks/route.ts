import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch personal tasks
    const personalTasks = await db.task.findMany({
      where: { userId },
      include: { category: true },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    // Fetch project tasks assigned to this user
    const projectTasks = await db.projectTask.findMany({
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

    // Normalize personal tasks with source tag
    const normalizedPersonal = personalTasks.map((t) => ({
      ...t,
      source: "personal" as const,
      projectId: null,
      projectName: null,
      projectColor: null,
    }));

    // Normalize project tasks to match task list shape
    const normalizedProject = projectTasks.map((t) => ({
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
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      source: "project" as const,
      projectId: t.projectId,
      projectName: t.project.name,
      projectColor: t.project.color,
    }));

    // Merge and sort by due date, then created date
    const allTasks = [...normalizedPersonal, ...normalizedProject].sort((a, b) => {
      // Tasks with due dates come first
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      // Then by creation date (newest first)
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
