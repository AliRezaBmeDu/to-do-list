import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const search = request.nextUrl.searchParams.get("q") || "";

    // Get existing friend relationships
    const existing = await db.friendRequest.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }], status: { in: ["pending", "accepted"] } },
      select: { senderId: true, receiverId: true, status: true },
    });
    const relatedIds = new Set<string>();
    existing.forEach((r) => { relatedIds.add(r.senderId); relatedIds.add(r.receiverId); });
    relatedIds.add(userId);

    const users = await db.user.findMany({
      where: {
        id: { notIn: [...relatedIds] },
        ...(search ? { OR: [{ name: { contains: search } }, { username: { contains: search } }] } : {}),
      },
      select: { id: true, name: true, username: true, avatar: true },
      take: 50,
    });

    // Also get pending requests sent/received
    const pending = await db.friendRequest.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }], status: "pending" },
      include: {
        sender: { select: { id: true, name: true, username: true, avatar: true } },
        receiver: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });

    return NextResponse.json({ users, pending, friends: existing.filter((r) => r.status === "accepted").length });
  } catch (error) {
    console.error("Users list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
