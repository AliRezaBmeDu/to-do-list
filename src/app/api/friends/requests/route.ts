import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// GET /api/friends/requests — List pending incoming friend requests
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const requests = await db.friendship.findMany({
      where: {
        addresseeId: userId,
        status: "pending",
      },
      include: {
        requester: { select: { id: true, username: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Get friend requests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
