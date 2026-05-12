import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// GET /api/friends — List all accepted friends
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const accepted = await db.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: { id: true, username: true, name: true, avatar: true } },
        addressee: { select: { id: true, username: true, name: true, avatar: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const friends = accepted.map((f) => {
      const friend = f.requesterId === userId ? f.addressee : f.requester;
      return { ...friend, friendshipId: f.id };
    });

    return NextResponse.json(friends);
  } catch (error) {
    console.error("Get friends error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/friends — Send a friend request by username
export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { username } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.id === userId) {
      return NextResponse.json({ error: "You cannot send a friend request to yourself" }, { status: 400 });
    }

    // Check if a friendship already exists (in either direction)
    const existing = await db.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: targetUser.id },
          { requesterId: targetUser.id, addresseeId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === "accepted") {
        return NextResponse.json({ error: "You are already friends" }, { status: 409 });
      }
      if (existing.status === "pending" && existing.requesterId === userId) {
        return NextResponse.json({ error: "Friend request already sent" }, { status: 409 });
      }
      if (existing.status === "pending" && existing.addresseeId === userId) {
        return NextResponse.json({ error: "This user already sent you a request — check your pending requests" }, { status: 409 });
      }
      if (existing.status === "blocked") {
        return NextResponse.json({ error: "Cannot send friend request" }, { status: 403 });
      }
    }

    const friendship = await db.friendship.create({
      data: {
        requesterId: userId,
        addresseeId: targetUser.id,
        status: "pending",
      },
      include: {
        addressee: { select: { id: true, username: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(friendship, { status: 201 });
  } catch (error) {
    console.error("Send friend request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
