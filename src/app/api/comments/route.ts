import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const taskId = request.nextUrl.searchParams.get("taskId");
    if (!taskId)
      return NextResponse.json({ error: "taskId required" }, { status: 400 });

    const comments = await db.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { taskId, content } = await request.json();
    if (!taskId || !content?.trim())
      return NextResponse.json(
        { error: "taskId and content required" },
        { status: 400 },
      );

    const comment = await db.comment.create({
      data: { taskId, content: content.trim(), userId },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
