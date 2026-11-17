import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { fail, safeMutation } from "@/lib/http";

const updateUserSchema = z.object({ isActive: z.boolean() });
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    safeMutation(request);
    const admin = await requireAdmin();
    const { id } = await context.params;
    const { isActive } = updateUserSchema.parse(await request.json());
    if (id === admin.id && !isActive) throw new Error("SELF_DEACTIVATE");

    const user = await prisma.user.update({
      where: { id }, data: { isActive }, select: { id: true, isActive: true }
    });
    return NextResponse.json(user);
  } catch (error) {
    return fail(error);
  }
}
