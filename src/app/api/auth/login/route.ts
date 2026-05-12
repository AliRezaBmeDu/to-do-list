import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSessionCookie, verifyPassword } from "@/lib/auth";

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

    const user = await db.user.findUnique({ where: { username } });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Support both legacy plain-text and new hashed passwords
    let valid = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      valid = await verifyPassword(password, user.password);
    } else {
      // Legacy plain-text comparison (migrate on next login)
      valid = user.password === password;
    }

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Auto-migrate legacy plain-text passwords to bcrypt
    if (!user.password.startsWith("$2a$") && !user.password.startsWith("$2b$")) {
      const { hashPassword } = await import("@/lib/auth");
      const hashed = await hashPassword(password);
      await db.user.update({ where: { id: user.id }, data: { password: hashed } });
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
