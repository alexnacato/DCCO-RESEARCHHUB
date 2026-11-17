import { prisma } from "@/lib/db/prisma";
import { articleKey, type ResearchArticle } from "./search";

export async function attachAnnotations(items: ResearchArticle[]) {
  if (!items.length) return items;
  const keys = items.map(articleKey);
  const annotations = await prisma.researchArticleAnnotation.findMany({
    where: { articleKey: { in: keys } },
    select: { articleKey: true, researchLine: true, laboratory: true }
  });
  const byKey = new Map(annotations.map(annotation => [annotation.articleKey, annotation]));
  return items.map(article => ({
    ...article,
    articleKey: articleKey(article),
    annotation: byKey.get(articleKey(article)) ?? null
  }));
}
