import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// PUT /api/projects/[id]/tasks/[taskId] — Update a project task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id, taskId } = await params;

    // Verify membership
    const membership = await db.projectMember.findFirst({
      where: { projectId: id, userId },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // Viewers cannot update tasks
    if (membership.role === "viewer") {
      return NextResponse.json({ error: "Viewers cannot update tasks" }, { status: 403 });
    }

    const existing = await db.projectTask.findFirst({ where: { id: taskId, projectId: id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();

    // If assigneeId is provided, verify they're a project member
    if (body.assigneeId !== undefined && body.assigneeId) {
      const assigneeMembership = await db.projectMember.findFirst({
        where: { projectId: id, userId: body.assigneeId },
      });
      if (!assigneeMembership) {
        return NextResponse.json({ error: "Assignee is not a project member" }, { status: 400 });
      }
    }

    const task = await db.projectTask.update({
      where: { id: taskId },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate || null }),
        ...(body.dueTime !== undefined && { dueTime: body.dueTime || null }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.isRecurring !== undefined && { isRecurring: body.isRecurring }),
        ...(body.recurRule !== undefined && { recurRule: body.recurRule || null }),
        ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId || null }),
        ...(body.status === "done" && !existing.completedAt && { completedAt: new Date().toISOString() }),
        ...(body.status !== "done" && { completedAt: null }),
      },
      include: {
        assignee: { select: { id: true, username: true, name: true, avatar: true } },
        createdBy: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Update project task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/tasks/[taskId] — Delete a project task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id, taskId } = await params;

    const membership = await db.projectMember.findFirst({
      where: { projectId: id, userId },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const existing = await db.projectTask.findFirst({ where: { id: taskId, projectId: id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Only owner/admin, or the creator, can delete
    const canDelete =
      membership.role === "owner" ||
      membership.role === "admin" ||
      existing.createdById === userId;

    if (!canDelete) {
      return NextResponse.json({ error: "You don't have permission to delete this task" }, { status: 403 });
    }

    await db.projectTask.delete({ where: { id: taskId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete project task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
