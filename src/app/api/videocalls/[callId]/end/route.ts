import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// PUT /api/videocalls/[callId]/end — End a video call (host only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { callId } = await params;

    const call = await db.videoCall.findFirst({
      where: { id: callId, hostId: userId },
    });

    if (!call) {
      return NextResponse.json({ error: "Only the host can end the call" }, { status: 403 });
    }

    await db.videoCall.update({
      where: { id: callId },
      data: { status: "ended", endedAt: new Date().toISOString() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("End videocall error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
