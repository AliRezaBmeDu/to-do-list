import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// GET /api/messages/[friendId] — Get message history with a specific friend
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { friendId } = await params;

    // Verify they are friends
    const friendship = await db.friendship.findFirst({
      where: {
        status: "accepted",
        OR: [
          { requesterId: userId, addresseeId: friendId },
          { requesterId: friendId, addresseeId: userId },
        ],
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: "You can only message friends" }, { status: 403 });
    }

    // Mark unread messages from this friend as read
    await db.message.updateMany({
      where: { senderId: friendId, receiverId: userId, read: false },
      data: { read: true },
    });

    // Get messages
    const messages = await db.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      include: {
        sender: { select: { id: true, username: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/messages/[friendId] — Send a message to a friend
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { friendId } = await params;

    // Verify they are friends
    const friendship = await db.friendship.findFirst({
      where: {
        status: "accepted",
        OR: [
          { requesterId: userId, addresseeId: friendId },
          { requesterId: friendId, addresseeId: userId },
        ],
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: "You can only message friends" }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const message = await db.message.create({
      data: {
        senderId: userId,
        receiverId: friendId,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
