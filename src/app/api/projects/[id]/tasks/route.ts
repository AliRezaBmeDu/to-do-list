import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// GET /api/projects/[id]/tasks — List all tasks in a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    // Verify membership
    const membership = await db.projectMember.findFirst({
      where: { projectId: id, userId },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not a member of this project" }, { status: 403 });
    }

    const tasks = await db.projectTask.findMany({
      where: { projectId: id },
      include: {
        assignee: { select: { id: true, username: true, name: true, avatar: true } },
        createdBy: { select: { id: true, username: true, name: true, avatar: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Get project tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/projects/[id]/tasks — Create a task in a project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    // Verify membership (viewers cannot create tasks)
    const membership = await db.projectMember.findFirst({
      where: { projectId: id, userId, role: { in: ["owner", "admin", "member"] } },
    });
    if (!membership) {
      return NextResponse.json({ error: "You don't have permission to create tasks in this project" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title, description, status, priority, dueDate, dueTime,
      tags, isRecurring, recurRule, assigneeId,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // If assigneeId is provided, verify they're a project member
    if (assigneeId) {
      const assigneeMembership = await db.projectMember.findFirst({
        where: { projectId: id, userId: assigneeId },
      });
      if (!assigneeMembership) {
        return NextResponse.json({ error: "Assignee is not a project member" }, { status: 400 });
      }
    }

    const task = await db.projectTask.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || "todo",
        priority: priority || "medium",
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        tags: tags || "",
        isRecurring: isRecurring || false,
        recurRule: recurRule || null,
        assigneeId: assigneeId || null,
        projectId: id,
        createdById: userId,
      },
      include: {
        assignee: { select: { id: true, username: true, name: true, avatar: true } },
        createdBy: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Create project task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
