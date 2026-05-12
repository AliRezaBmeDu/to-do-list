import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { requestId } = await request.json();
    if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

    const req = await db.friendRequest.findUnique({ where: { id: requestId } });
    if (!req || req.receiverId !== userId || req.status !== "pending") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const updated = await db.friendRequest.update({
      where: { id: requestId },
      data: { status: "accepted" },
    });

    await db.notification.create({
      data: { userId: req.senderId, type: "friend_request", title: "Friend Request Accepted", body: "Your friend request was accepted!", linkId: requestId },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Accept error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
