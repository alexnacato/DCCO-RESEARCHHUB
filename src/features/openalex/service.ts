export const ESPE_INSTITUTION_ID = "I118946981";
export const OPENALEX_PAGE_SIZE = 10;
export const MAX_SEMANTIC_RESULTS = 50;

type OpenAlexWork = {
  id: string;
  title: string | null;
  doi: string | null;
  publication_year: number | null;
  cited_by_count: number | null;
  type: string;
  abstract_inverted_index: Record<string, number[]> | null;
  authorships: Array<{
    author: { display_name: string | null };
    institutions: Array<{ id: string }>;
    raw_affiliation_strings: string[];
  }>;
  primary_topic: { display_name: string } | null;
  primary_location: { landing_page_url: string | null } | null;
  best_oa_location: { landing_page_url: string | null; pdf_url: string | null } | null;
};

type OpenAlexResponse = { meta: { count: number }; results: OpenAlexWork[] };

export type OpenAlexArticle = {
  id: string;
  title: string;
  doi: string | null;
  year: number | null;
  authors: string[];
  abstract: string | null;
  topic: string | null;
  citations: number;
  workType: string;
  url: string;
  pdfUrl: string | null;
  dccoAffiliationMentioned: boolean;
};

export function buildOpenAlexUrl({ idea, year, page }: { idea: string; year?: number; page: number }) {
  const url = new URL("https://api.openalex.org/works");
  const filters = [`institutions.id:${ESPE_INSTITUTION_ID}`, "type:article|conference-paper"];
  if (year) filters.push(`publication_year:${year}`);
  url.searchParams.set("filter", filters.join(","));
  url.searchParams.set("per_page", String(OPENALEX_PAGE_SIZE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("search.semantic", idea);
  url.searchParams.set("select", "id,title,doi,publication_year,cited_by_count,type,abstract_inverted_index,authorships,primary_topic,primary_location,best_oa_location");
  if (process.env.OPENALEX_API_KEY) url.searchParams.set("api_key", process.env.OPENALEX_API_KEY);
  return url;
}

export function reconstructAbstract(index: Record<string, number[]> | null): string | null {
  if (!index) return null;
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const position of positions) if (Number.isInteger(position) && position >= 0 && position < 10000) words[position] = word;
  }
  return words.length ? words.map(word => word ?? "").join(" ").trim() : null;
}

function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch { return null; }
}

export function mapOpenAlexWork(work: OpenAlexWork): OpenAlexArticle {
  const espeAuthors = (work.authorships ?? []).filter(authorship =>
    (authorship.institutions ?? []).some(institution => institution.id.endsWith(`/${ESPE_INSTITUTION_ID}`))
  );
  const affiliationPattern = /(?:departamento\s+de\s+ciencias?\s+de\s+la\s+computaci[oó]n|department\s+of\s+computer\s+science|\bDCCO\b)/i;
  const doi = safeExternalUrl(work.doi);
  return {
    id: work.id,
    title: work.title || "Sin título",
    doi,
    year: work.publication_year,
    authors: (work.authorships ?? []).map(item => item.author?.display_name).filter((name): name is string => !!name),
    abstract: reconstructAbstract(work.abstract_inverted_index),
    topic: work.primary_topic?.display_name ?? null,
    citations: work.cited_by_count ?? 0,
    workType: work.type === "conference-paper" ? "Ponencia" : "Artículo",
    url: safeExternalUrl(work.best_oa_location?.landing_page_url)
      ?? safeExternalUrl(work.primary_location?.landing_page_url)
      ?? doi
      ?? safeExternalUrl(work.id)
      ?? "https://openalex.org",
    pdfUrl: safeExternalUrl(work.best_oa_location?.pdf_url),
    dccoAffiliationMentioned: espeAuthors.some(item => (item.raw_affiliation_strings ?? []).some(value => affiliationPattern.test(value)))
  };
}

export async function searchOpenAlexArticles(input: { idea: string; year?: number; page: number }) {
  let response: Response;
  try {
    response = await fetch(buildOpenAlexUrl(input), { signal: AbortSignal.timeout(12000), next: { revalidate: 900 } });
  } catch {
    throw new Error("OPENALEX_UNAVAILABLE");
  }
  if (response.status === 429) throw new Error("OPENALEX_RATE_LIMIT");
  if (!response.ok) throw new Error("OPENALEX_UNAVAILABLE");
  let payload: OpenAlexResponse;
  try { payload = await response.json() as OpenAlexResponse; } catch { throw new Error("OPENALEX_UNAVAILABLE"); }
  if (!Array.isArray(payload.results) || typeof payload.meta?.count !== "number") throw new Error("OPENALEX_UNAVAILABLE");
  return { items: payload.results.map(mapOpenAlexWork), total: Math.min(payload.meta.count, MAX_SEMANTIC_RESULTS), page: input.page, pageSize: OPENALEX_PAGE_SIZE };
}
