import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { requestId } = await request.json();
    if (!requestId)
      return NextResponse.json(
        { error: "requestId required" },
        { status: 400 },
      );

    const req = await db.friendship.findUnique({ where: { id: requestId } });
    if (!req || req.addresseeId !== userId || req.status !== "pending") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await db.friendship.update({
      where: { id: requestId },
      data: { status: "rejected" },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reject error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
