import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const accepted = await db.friendRequest.findMany({
      where: { status: "accepted", OR: [{ senderId: userId }, { receiverId: userId }] },
      include: {
        sender: { select: { id: true, name: true, username: true, avatar: true } },
        receiver: { select: { id: true, name: true, username: true, avatar: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const friends = accepted.map((r) => r.senderId === userId ? r.receiver : r.sender);
    return NextResponse.json(friends);
  } catch (error) {
    console.error("Friends list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
