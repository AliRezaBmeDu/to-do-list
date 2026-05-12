import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// GET /api/projects/[id]/members — List project members
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

    const membership = await db.projectMember.findFirst({
      where: { projectId: id, userId },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const members = await db.projectMember.findMany({
      where: { projectId: id },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/projects/[id]/members — Add a member directly by userId (admin/owner only)
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
      return NextResponse.json({ error: "Only owners and admins can add members" }, { status: 403 });
    }

    const body = await request.json();
    const { targetUserId, role } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    // Check if already a member
    const existing = await db.projectMember.findFirst({
      where: { projectId: id, userId: targetUserId },
    });
    if (existing) {
      return NextResponse.json({ error: "User is already a member" }, { status: 409 });
    }

    const member = await db.projectMember.create({
      data: {
        projectId: id,
        userId: targetUserId,
        role: role || "member",
      },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
