import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// GET /api/posts — Get feed: my posts + friends' posts
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get all friend IDs
    const friendships = await db.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });

    const friendIds = friendships.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );

    // Feed = my posts + friends' posts
    const authorIds = [userId, ...friendIds];

    const posts = await db.post.findMany({
      where: { authorId: { in: authorIds } },
      include: {
        author: { select: { id: true, username: true, name: true, avatar: true } },
        likes: {
          include: { user: { select: { id: true, username: true, name: true, avatar: true } } },
        },
        comments: {
          include: { user: { select: { id: true, username: true, name: true, avatar: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/posts — Create a new post
export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { content, image } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Post content is required" }, { status: 400 });
    }

    const post = await db.post.create({
      data: {
        content: content.trim(),
        image: image || null,
        authorId: userId,
      },
      include: {
        author: { select: { id: true, username: true, name: true, avatar: true } },
        likes: { include: { user: { select: { id: true, username: true, name: true, avatar: true } } } },
        comments: { include: { user: { select: { id: true, username: true, name: true, avatar: true } } } },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
