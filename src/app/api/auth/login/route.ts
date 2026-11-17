import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { session } from "@/lib/auth/session";
import { fail, safeMutation } from "@/lib/http";

const loginSchema = z.object({
  email: z.string().email().transform(value => value.toLowerCase().trim()),
  password: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    safeMutation(request);
    const { email, password } = loginSchema.parse(await request.json());
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const since = new Date(Date.now() - 15 * 60_000);

    const failedAttempts = await prisma.loginAttempt.count({
      where: { email, succeeded: false, createdAt: { gte: since } }
    });
    if (failedAttempts >= 5) {
      return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = !!user?.isActive && await bcrypt.compare(password, user.passwordHash);
    await prisma.loginAttempt.create({ data: { email, ip, succeeded: valid } });
    if (!valid || !user) {
      return NextResponse.json({ error: "Credenciales incorrectas o cuenta inactiva" }, { status: 401 });
    }

    const currentSession = await session();
    currentSession.userId = user.id;
    await currentSession.save();
    return NextResponse.json({ id: user.id, fullName: user.fullName, role: user.role });
  } catch (error) {
    return fail(error);
  }
}
