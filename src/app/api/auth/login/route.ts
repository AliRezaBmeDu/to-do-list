import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PRESET_USERS, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Check preset users
    const preset = PRESET_USERS.find(
      (u) => u.username === username && u.password === password
    );

    if (!preset) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Find or create user in DB
    let user = await db.user.findUnique({ where: { username: preset.username } });
    if (!user) {
      user = await db.user.create({
        data: {
          username: preset.username,
          password: preset.password,
          name: preset.name,
          avatar: preset.avatar,
        },
      });
    }

    await setSessionCookie(user.id);

    return NextResponse.json({
      id: user.id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
