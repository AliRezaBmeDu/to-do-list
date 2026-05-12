import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// GET /api/users/search?q=username — Search users by username
export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ error: "Search query must be at least 2 characters" }, { status: 400 });
    }

    const users = await db.user.findMany({
      where: {
        username: { contains: query, mode: "insensitive" },
        id: { not: userId }, // Exclude self
      },
      select: { id: true, username: true, name: true, avatar: true },
      take: 10,
    });

    // Also check friendship status for each user
    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
    });

    const usersWithStatus = users.map((user) => {
      const friendship = friendships.find(
        (f) =>
          (f.requesterId === userId && f.addresseeId === user.id) ||
          (f.requesterId === user.id && f.addresseeId === userId)
      );
      return {
        ...user,
        friendshipStatus: friendship?.status ?? "none",
        friendshipId: friendship?.id ?? null,
      };
    });

    return NextResponse.json(usersWithStatus);
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
