import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// GET /api/projects/[id] — Get project details
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
      return NextResponse.json({ error: "You are not a member of this project" }, { status: 403 });
    }

    const project = await db.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true, name: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, name: true, avatar: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, username: true, name: true, avatar: true } },
            createdBy: { select: { id: true, username: true, name: true, avatar: true } },
          },
          orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Add myRole to the response
    return NextResponse.json({ ...project, myRole: membership.role });
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/projects/[id] — Update project (owner/admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    // Verify admin/owner role
    const membership = await db.projectMember.findFirst({
      where: { projectId: id, userId, role: { in: ["owner", "admin"] } },
    });

    if (!membership) {
      return NextResponse.json({ error: "Only owners and admins can update this project" }, { status: 403 });
    }

    const body = await request.json();

    const project = await db.project.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.icon !== undefined && { icon: body.icon }),
      },
      include: {
        owner: { select: { id: true, username: true, name: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, name: true, avatar: true } },
          },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/projects/[id] — Delete project (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    // Verify owner role
    const membership = await db.projectMember.findFirst({
      where: { projectId: id, userId, role: "owner" },
    });

    if (!membership) {
      return NextResponse.json({ error: "Only the project owner can delete this project" }, { status: 403 });
    }

    await db.project.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
