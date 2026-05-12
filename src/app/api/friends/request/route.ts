import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { receiverId } = await request.json();
    if (!receiverId) return NextResponse.json({ error: "receiverId required" }, { status: 400 });
    if (receiverId === userId) return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });

    // Check if request already exists
    const existing = await db.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId },
          { senderId: receiverId, receiverId: userId },
        ],
        status: { in: ["pending", "accepted"] },
      },
    });
    if (existing) return NextResponse.json({ error: "Request already exists" }, { status: 409 });

    const req = await db.friendRequest.create({
      data: { senderId: userId, receiverId },
      include: { sender: { select: { id: true, name: true, username: true, avatar: true } } },
    });

    // Create notification
    await db.notification.create({
      data: { userId: receiverId, type: "friend_request", title: "Friend Request", body: `${req.sender.name} sent you a friend request`, linkId: req.id },
    });

    return NextResponse.json(req, { status: 201 });
  } catch (error) {
    console.error("Friend request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
