import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { fail, safeMutation } from "@/lib/http";

const createUserSchema = z.object({
  fullName: z.string().trim().min(3).max(150),
  email: z.string().email().transform(value => value.toLowerCase().trim()),
  password: z.string().min(10).max(100),
  role: z.enum(["ADMIN", "USER"])
});

const publicUserFields = {
  id: true, fullName: true, email: true, role: true, isActive: true
} as const;

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      select: { ...publicUserFields, createdAt: true },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(users);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    safeMutation(request);
    await requireAdmin();
    const input = createUserSchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: { fullName: input.fullName, email: input.email, role: input.role, passwordHash },
      select: publicUserFields
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
