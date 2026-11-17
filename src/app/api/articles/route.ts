import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { fail } from "@/lib/http";
import { searchArticles } from "@/features/articles/search";
import { attachAnnotations } from "@/features/articles/annotations";

const parameters = z.object({
  q: z.string().trim().min(10).max(2000),
  year: z.union([z.literal(""), z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1)]).default(""),
  page: z.coerce.number().int().min(1).max(5).default(1)
});

export async function GET(request: NextRequest) {
  try {
    await requireUser();
    const params = parameters.parse(Object.fromEntries(request.nextUrl.searchParams));
    const results = await searchArticles({ idea: params.q, year: params.year || undefined, page: params.page });
    return NextResponse.json({ ...results, items: await attachAnnotations(results.items) });
  } catch (error) { return fail(error); }
}
