import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// GET /api/projects — List all projects I'm a member of
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const memberships = await db.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            owner: { select: { id: true, username: true, name: true, avatar: true } },
            members: {
              include: {
                user: { select: { id: true, username: true, name: true, avatar: true } },
              },
            },
            _count: { select: { tasks: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const projects = memberships.map((m) => ({
      id: m.project.id,
      name: m.project.name,
      description: m.project.description,
      color: m.project.color,
      icon: m.project.icon,
      ownerId: m.project.ownerId,
      owner: m.project.owner,
      myRole: m.role,
      members: m.project.members,
      taskCount: m.project._count.tasks,
      createdAt: m.project.createdAt,
      updatedAt: m.project.updatedAt,
    }));

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/projects — Create a new project
export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color, icon } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const project = await db.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || "#6366f1",
        icon: icon || "briefcase",
        ownerId: userId,
        members: {
          create: {
            userId,
            role: "owner",
          },
        },
      },
      include: {
        owner: { select: { id: true, username: true, name: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, name: true, avatar: true } },
          },
        },
        _count: { select: { tasks: true } },
      },
    });

    // Shape to match GET so the frontend Project type is satisfied
    const shaped = {
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      icon: project.icon,
      ownerId: project.ownerId,
      owner: project.owner,
      myRole: "owner" as const,
      members: project.members,
      taskCount: project._count.tasks,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };

    return NextResponse.json(shaped, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
