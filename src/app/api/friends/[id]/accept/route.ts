import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// PUT /api/friends/[id]/accept — Accept a friend request
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

    const friendship = await db.friendship.findFirst({
      where: { id, addresseeId: userId, status: "pending" },
    });

    if (!friendship) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
    }

    const updated = await db.friendship.update({
      where: { id },
      data: { status: "accepted" },
      include: {
        requester: { select: { id: true, username: true, name: true, avatar: true } },
        addressee: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Accept friend request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
