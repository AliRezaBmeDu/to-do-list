import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// GET /api/friends/requests/sent — List pending outgoing friend requests
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sent = await db.friendship.findMany({
      where: {
        requesterId: userId,
        status: "pending",
      },
      include: {
        addressee: { select: { id: true, username: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sent);
  } catch (error) {
    console.error("Get sent requests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
