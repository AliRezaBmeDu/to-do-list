import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // Assuming your frontend is sending `{ receiverId: string }`
    const { receiverId } = await request.json();
    if (!receiverId)
      return NextResponse.json(
        { error: "receiverId required" },
        { status: 400 },
      );
    if (receiverId === userId)
      return NextResponse.json(
        { error: "Cannot friend yourself" },
        { status: 400 },
      );

    // Check if request already exists (either direction)
    const existing = await db.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: receiverId },
          { requesterId: receiverId, addresseeId: userId },
        ],
        status: { in: ["pending", "accepted"] },
      },
    });
    if (existing)
      return NextResponse.json(
        { error: "Request already exists" },
        { status: 409 },
      );

    const req = await db.friendship.create({
      data: { requesterId: userId, addresseeId: receiverId },
      include: {
        requester: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json(req, { status: 201 });
  } catch (error) {
    console.error("Friend request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
