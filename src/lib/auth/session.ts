import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";
import { prisma } from "@/lib/db/prisma";

export type SessionData = { userId?: string };

const options = {
  cookieName: "dcco_session",
  password: process.env.SESSION_PASSWORD ?? "",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true" || !!process.env.VERCEL,
    sameSite: "lax" as const,
    path: "/"
  }
};

export async function session(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), options);
}

export async function currentUser() {
  const currentSession = await session();
  if (!currentSession.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: currentSession.userId },
    select: { id: true, fullName: true, email: true, role: true, isActive: true }
  });
  return user?.isActive ? user : null;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
