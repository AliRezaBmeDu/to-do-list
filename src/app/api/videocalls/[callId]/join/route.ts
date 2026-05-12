import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// PUT /api/videocalls/[callId]/join — Join a video call
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

    const participant = await db.videoCallParticipant.findFirst({
      where: { callId, userId },
    });

    if (!participant) {
      return NextResponse.json({ error: "You are not invited to this call" }, { status: 403 });
    }

    await db.videoCallParticipant.update({
      where: { id: participant.id },
      data: { status: "joined", joinedAt: new Date().toISOString() },
    });

    // If call was scheduled, set to active
    await db.videoCall.updateMany({
      where: { id: callId, status: "scheduled" },
      data: { status: "active" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Join videocall error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
