import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { RESEARCH_LINES, LABORATORIES } from "@/features/articles/classification-options";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { fail, safeMutation } from "@/lib/http";

const schema = z.object({
  articleKey: z.string().min(4).max(600).regex(/^(doi:|id:)/),
  researchLine: z.union([z.enum(RESEARCH_LINES), z.null()]),
  laboratory: z.union([z.enum(LABORATORIES), z.null()])
});

export async function POST(request: NextRequest) {
  try {
    safeMutation(request);
    const user = await requireAdmin();
    const data = schema.parse(await request.json());
    if (!data.researchLine && !data.laboratory) {
      await prisma.researchArticleAnnotation.deleteMany({ where: { articleKey: data.articleKey } });
      return NextResponse.json({ articleKey: data.articleKey, annotation: null });
    }
    const saved = await prisma.researchArticleAnnotation.upsert({
      where: { articleKey: data.articleKey },
      create: { articleKey: data.articleKey, researchLine: data.researchLine, laboratory: data.laboratory, updatedById: user.id },
      update: { researchLine: data.researchLine, laboratory: data.laboratory, updatedById: user.id },
      select: { articleKey: true, researchLine: true, laboratory: true }
    });
    return NextResponse.json({ articleKey: data.articleKey, annotation: saved });
  } catch (error) { return fail(error); }
}
