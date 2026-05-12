import { cookies } from "next/headers";
import { db } from "@/lib/db";

const SESSION_COOKIE = "todo_session";

// Preset users
export const PRESET_USERS = [
  { username: "admin", password: "admin123", name: "Admin User", avatar: "A" },
  { username: "dev", password: "dev123", name: "Developer", avatar: "D" },
  { username: "business", password: "biz123", name: "Business Pro", avatar: "B" },
];

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return null;

  const user = await db.user.findUnique({ where: { id: session } });
  return user?.id ?? null;
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
