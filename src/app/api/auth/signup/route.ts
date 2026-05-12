import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSessionCookie, MAX_USERS } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, name, password } = body;

    if (!username || !name || !password) {
      return NextResponse.json(
        { error: "Name, username, and password are required" },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Enforce 10-user limit
    const userCount = await db.user.count();
    if (userCount >= MAX_USERS) {
      return NextResponse.json(
        { error: "Registration is closed. The maximum number of users (10) has been reached." },
        { status: 403 }
      );
    }

    // Check if username is taken
    const existing = await db.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    const avatar = name.charAt(0).toUpperCase();

    const user = await db.user.create({
      data: { username, password, name, avatar },
    });

    await setSessionCookie(user.id);

    return NextResponse.json(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: return current user count (so the UI can warn when slots are filling up)
export async function GET() {
  try {
    const count = await db.user.count();
    return NextResponse.json({ count, max: MAX_USERS, spotsLeft: MAX_USERS - count });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
