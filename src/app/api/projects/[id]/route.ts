import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { id } = await params;
    const project = await db.project.findFirst({
      where: { id, OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
      include: {
        owner: { select: { id: true, name: true, username: true, avatar: true } },
        members: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } },
        tasks: { include: { category: true, assignee: { select: { id: true, name: true, username: true, avatar: true } }, comments: { include: { user: { select: { id: true, name: true, username: true, avatar: true } }, orderBy: { createdAt: "asc" } } }, orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }] } },
      },
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json(project);
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { id } = await params;
    const project = await db.project.findFirst({ where: { id, ownerId: userId } });
    if (!project) return NextResponse.json({ error: "Not project owner" }, { status: 403 });

    const body = await request.json();
    const updated = await db.project.update({
      where: { id },
      data: { ...(body.name !== undefined && { name: body.name.trim() }), ...(body.description !== undefined && { description: body.description?.trim() || null }), ...(body.color !== undefined && { color: body.color }) },
      include: { owner: { select: { id: true, name: true, username: true, avatar: true } }, members: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { id } = await params;
    const project = await db.project.findFirst({ where: { id, ownerId: userId } });
    if (!project) return NextResponse.json({ error: "Not project owner" }, { status: 403 });

    await db.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
