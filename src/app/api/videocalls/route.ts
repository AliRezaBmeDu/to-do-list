import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// GET /api/videocalls — Get my video calls (hosted + invited)
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Calls I'm hosting
    const hostedCalls = await db.videoCall.findMany({
      where: { hostId: userId },
      include: {
        host: { select: { id: true, username: true, name: true, avatar: true } },
        participants: {
          include: { user: { select: { id: true, username: true, name: true, avatar: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calls I'm invited to
    const invitedParticipations = await db.videoCallParticipant.findMany({
      where: { userId },
      include: {
        call: {
          include: {
            host: { select: { id: true, username: true, name: true, avatar: true } },
            participants: {
              include: { user: { select: { id: true, username: true, name: true, avatar: true } } },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const invitedCalls = invitedParticipations.map((p) => p.call);

    // Merge and deduplicate
    const allCallIds = new Set<string>();
    const allCalls: any[] = [];

    for (const call of [...hostedCalls, ...invitedCalls]) {
      if (!allCallIds.has(call.id)) {
        allCallIds.add(call.id);
        allCalls.push(call);
      }
    }

    // Sort by most recent first
    allCalls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(allCalls);
  } catch (error) {
    console.error("Get videocalls error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/videocalls — Create a new video call (schedule or instant)
export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { title, scheduledAt, participantIds } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Meeting title is required" }, { status: 400 });
    }

    // Generate a unique room name for Jitsi
    const roomName = `taskflow-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Verify all participant IDs are friends
    const friendIds: string[] = [];
    if (participantIds && participantIds.length > 0) {
      for (const pid of participantIds) {
        const friendship = await db.friendship.findFirst({
          where: {
            status: "accepted",
            OR: [
              { requesterId: userId, addresseeId: pid },
              { requesterId: pid, addresseeId: userId },
            ],
          },
        });
        if (friendship) friendIds.push(pid);
      }
    }

    const status = scheduledAt ? "scheduled" : "active";

    const videoCall = await db.videoCall.create({
      data: {
        roomName,
        title: title.trim(),
        hostId: userId,
        status,
        scheduledAt: scheduledAt || null,
        participants: {
          create: [
            // Host auto-joins
            { userId, status: "joined", joinedAt: new Date().toISOString() },
            // Invite friends
            ...friendIds.map((fid) => ({ userId: fid, status: "invited" as const })),
          ],
        },
      },
      include: {
        host: { select: { id: true, username: true, name: true, avatar: true } },
        participants: {
          include: { user: { select: { id: true, username: true, name: true, avatar: true } } },
        },
      },
    });

    return NextResponse.json(videoCall, { status: 201 });
  } catch (error) {
    console.error("Create videocall error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
