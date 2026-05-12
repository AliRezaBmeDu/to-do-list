import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// POST /api/projects/[id]/invite — Invite a user by username (admin/owner only)
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

    const myMembership = await db.projectMember.findFirst({
      where: { projectId: id, userId, role: { in: ["owner", "admin"] } },
    });
    if (!myMembership) {
      return NextResponse.json({ error: "Only owners and admins can invite members" }, { status: 403 });
    }

    const body = await request.json();
    const { username, role } = body;

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { username } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already a member
    const existing = await db.projectMember.findFirst({
      where: { projectId: id, userId: targetUser.id },
    });
    if (existing) {
      return NextResponse.json({ error: "User is already a member of this project" }, { status: 409 });
    }

    const member = await db.projectMember.create({
      data: {
        projectId: id,
        userId: targetUser.id,
        role: role || "member",
      },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Invite member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
