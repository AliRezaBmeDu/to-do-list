import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const projects = await db.project.findMany({
      where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
      include: {
        owner: { select: { id: true, name: true, username: true, avatar: true } },
        members: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } },
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { name, description, color } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const project = await db.project.create({
      data: { name: name.trim(), description: description?.trim() || null, color: color || "#10b981", ownerId: userId, members: { create: { userId, role: "owner" } } },
      include: { owner: { select: { id: true, name: true, username: true, avatar: true } }, members: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } } },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
