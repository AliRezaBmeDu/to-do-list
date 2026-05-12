import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// POST /api/posts/[postId]/like — Toggle like on a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { postId } = await params;

    // Check if already liked
    const existing = await db.postLike.findFirst({
      where: { postId, userId },
    });

    if (existing) {
      // Unlike
      await db.postLike.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await db.postLike.create({
        data: { postId, userId },
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Toggle like error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
