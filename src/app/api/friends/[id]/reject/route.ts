import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// PUT /api/friends/[id]/reject — Reject a friend request
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

    await db.friendship.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reject friend request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
