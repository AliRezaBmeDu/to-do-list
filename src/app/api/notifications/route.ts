import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await db.notification.count({ where: { userId, read: false } });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { id, markAll } = await request.json();

    if (markAll) {
      await db.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    } else if (id) {
      await db.notification.update({ where: { id, userId }, data: { read: true } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
