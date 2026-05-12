import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const accepted = await db.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        addressee: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const friends = accepted.map((r) => {
      const friendData = r.requesterId === userId ? r.addressee : r.requester;
      return { ...friendData, friendshipId: r.id };
    });

    return NextResponse.json(friends);
  } catch (error) {
    console.error("Friends list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
