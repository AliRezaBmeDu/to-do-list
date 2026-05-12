import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { id } = await params;
    const membership = await db.projectMember.findFirst({ where: { projectId: id, userId } });
    if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

    const members = await db.projectMember.findMany({
      where: { projectId: id },
      include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { id } = await params;
    // Only owner/admin can add members
    const membership = await db.projectMember.findFirst({ where: { projectId: id, userId, role: { in: ["owner", "admin"] } } });
    if (!membership) return NextResponse.json({ error: "Not authorized to add members" }, { status: 403 });

    const { newUserId, role } = await request.json();
    if (!newUserId) return NextResponse.json({ error: "newUserId required" }, { status: 400 });

    const existing = await db.projectMember.findUnique({ where: { projectId_userId: { projectId: id, userId: newUserId } } });
    if (existing) return NextResponse.json({ error: "Already a member" }, { status: 409 });

    const member = await db.projectMember.create({
      data: { projectId: id, userId: newUserId, role: role || "member" },
      include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
    });

    await db.notification.create({
      data: { userId: newUserId, type: "project_invite", title: "Project Invite", body: `You were added to a project`, linkId: id },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { id } = await params;
    const { removeUserId } = await request.json();

    // Owner can remove anyone; users can remove themselves
    if (removeUserId !== userId) {
      const membership = await db.projectMember.findFirst({ where: { projectId: id, userId, role: { in: ["owner", "admin"] } } });
      if (!membership) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await db.projectMember.delete({ where: { projectId_userId: { projectId: id, userId: removeUserId } } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
