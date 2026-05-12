import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// PUT /api/projects/[id]/members/[memberId] — Change member role (owner/admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id, memberId } = await params;

    const myMembership = await db.projectMember.findFirst({
      where: { projectId: id, userId, role: { in: ["owner", "admin"] } },
    });
    if (!myMembership) {
      return NextResponse.json({ error: "Only owners and admins can change roles" }, { status: 403 });
    }

    // Cannot change owner's role
    const target = await db.projectMember.findUnique({ where: { id: memberId } });
    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (target.role === "owner") {
      return NextResponse.json({ error: "Cannot change owner's role" }, { status: 403 });
    }

    const body = await request.json();
    const { role } = body;

    if (!["admin", "member", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const updated = await db.projectMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/members/[memberId] — Remove a member (owner/admin only, or self-leave)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id, memberId } = await params;

    const target = await db.projectMember.findUnique({ where: { id: memberId } });
    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Self-leave is allowed (unless owner)
    if (target.userId === userId) {
      if (target.role === "owner") {
        return NextResponse.json({ error: "Owner cannot leave the project. Transfer ownership or delete the project." }, { status: 403 });
      }
      await db.projectMember.delete({ where: { id: memberId } });
      return NextResponse.json({ success: true });
    }

    // Otherwise, must be owner/admin
    const myMembership = await db.projectMember.findFirst({
      where: { projectId: id, userId, role: { in: ["owner", "admin"] } },
    });
    if (!myMembership) {
      return NextResponse.json({ error: "Only owners and admins can remove members" }, { status: 403 });
    }

    if (target.role === "owner") {
      return NextResponse.json({ error: "Cannot remove the project owner" }, { status: 403 });
    }

    await db.projectMember.delete({ where: { id: memberId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
