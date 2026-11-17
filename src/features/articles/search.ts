import { searchOpenAlexArticles, type OpenAlexArticle } from "../openalex/service";
import { searchOpenAireArticles } from "../openaire/service";

export type ArticleAnnotation = { researchLine: string | null; laboratory: string | null };
export type ResearchArticle = OpenAlexArticle & {
  sources: Array<"OpenAlex" | "OpenAIRE">;
  articleKey?: string;
  annotation?: ArticleAnnotation | null;
};

function doiKey(article: OpenAlexArticle) {
  return article.doi?.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "").toLowerCase() ?? null;
}

export function articleKey(article: OpenAlexArticle) {
  const doi = doiKey(article);
  return doi ? `doi:${doi}` : `id:${article.id}`;
}

export function mergeArticles(openAlex: OpenAlexArticle[], openAire: OpenAlexArticle[]): ResearchArticle[] {
  const articles: ResearchArticle[] = [];
  const seen = new Map<string, ResearchArticle>();
  for (const [source, items] of [["OpenAlex", openAlex], ["OpenAIRE", openAire]] as const) {
    for (const article of items) {
      const key = doiKey(article);
      const existing = key ? seen.get(key) : undefined;
      if (existing) {
        existing.sources.push(source);
        if (!existing.abstract && article.abstract) existing.abstract = article.abstract;
        if (!existing.pdfUrl && article.pdfUrl) existing.pdfUrl = article.pdfUrl;
        if (!existing.topic && article.topic) existing.topic = article.topic;
        continue;
      }
      const merged = { ...article, sources: [source] } as ResearchArticle;
      articles.push(merged);
      if (key) seen.set(key, merged);
    }
  }
  return articles;
}

export async function searchArticles(input: { idea: string; year?: number; page: number }) {
  const [alex, aire] = await Promise.allSettled([searchOpenAlexArticles(input), searchOpenAireArticles(input)]);
  if (alex.status === "rejected" && aire.status === "rejected") throw new Error("SEARCH_UNAVAILABLE");
  const openAlex = alex.status === "fulfilled" ? alex.value : null;
  const openAire = aire.status === "fulfilled" ? aire.value : null;
  return {
    items: mergeArticles(openAlex?.items ?? [], openAire?.items ?? []),
    page: input.page,
    hasNextPage: input.page < 5 && Boolean((openAlex && input.page * openAlex.pageSize < openAlex.total) || (openAire && input.page * openAire.pageSize < openAire.total)),
    availableSources: [openAlex && "OpenAlex", openAire && "OpenAIRE"].filter(Boolean),
    unavailableSources: [!openAlex && "OpenAlex", !openAire && "OpenAIRE"].filter(Boolean)
  };
}
