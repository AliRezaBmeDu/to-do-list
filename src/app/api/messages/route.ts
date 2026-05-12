import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// GET /api/messages — Get all conversations (list of friends with last message + unread count)
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get all friends
    const friendships = await db.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: { id: true, username: true, name: true, avatar: true } },
        addressee: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });

    const friends = friendships.map((f) => {
      const friend = f.requesterId === userId ? f.addressee : f.requester;
      return { ...friend, friendshipId: f.id };
    });

    // For each friend, get the last message and unread count
    const conversations = await Promise.all(
      friends.map(async (friend) => {
        const lastMessage = await db.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: friend.id },
              { senderId: friend.id, receiverId: userId },
            ],
          },
          orderBy: { createdAt: "desc" },
        });

        const unreadCount = await db.message.count({
          where: {
            senderId: friend.id,
            receiverId: userId,
            read: false,
          },
        });

        return {
          friend,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                senderId: lastMessage.senderId,
                createdAt: lastMessage.createdAt,
              }
            : null,
          unreadCount,
        };
      })
    );

    // Sort by last message time (most recent first), no-message conversations last
    conversations.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
