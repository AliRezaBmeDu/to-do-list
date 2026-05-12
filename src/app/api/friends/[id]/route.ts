import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// DELETE /api/friends/[id] — Remove a friend (delete the friendship)
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

    const friendship = await db.friendship.findFirst({
      where: {
        id,
        status: "accepted",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
    }

    await db.friendship.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove friend error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
