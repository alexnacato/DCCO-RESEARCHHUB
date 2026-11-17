import type { OpenAlexArticle } from "../openalex/service";

export const ESPE_ROR = "https://ror.org/05j136930";
export const OPENAIRE_PAGE_SIZE = 10;
export const MAX_OPENAIRE_RESULTS = 50;

type OpenAireWork = {
  id: string;
  mainTitle?: string | null;
  pids?: Array<{ scheme?: string; value?: string }>;
  publicationDate?: string | null;
  descriptions?: string[];
  authors?: Array<{ fullName?: string }>;
  instances?: Array<{ type?: string; urls?: string[] }>;
};

type OpenAireResponse = { header: { numFound: number }; results: OpenAireWork[] };

function safeUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch { return null; }
}

export function buildOpenAireUrl({ idea, year, page }: { idea: string; year?: number; page: number }) {
  const url = new URL("https://api.openaire.eu/graph/v4/research-products");
  const filters = ["type:publication", "instance_type:Article", `authorships.institutions.ror:${ESPE_ROR}`];
  if (year) filters.push(`from_publication_year:${year}`, `to_publication_year:${year}`);
  url.searchParams.set("filter", filters.join(","));
  url.searchParams.set("search", idea);
  url.searchParams.set("page", String(page));
  url.searchParams.set("page_size", String(OPENAIRE_PAGE_SIZE));
  url.searchParams.set("select", "id,mainTitle,pids,publicationDate,descriptions,authors.fullName,instances");
  return url;
}

export function mapOpenAireWork(work: OpenAireWork): OpenAlexArticle | null {
  if (!work.id || !work.mainTitle) return null;
  const rawDoi = work.pids?.find(pid => pid.scheme?.toLowerCase() === "doi")?.value;
  const doi = rawDoi ? safeUrl(`https://doi.org/${rawDoi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")}`) : null;
  const publicationUrl = work.instances?.flatMap(instance => instance.urls ?? []).map(safeUrl).find(Boolean) ?? null;
  const url = doi ?? publicationUrl;
  if (!url) return null;
  const year = work.publicationDate?.match(/^\d{4}/)?.[0];
  return {
    id: work.id,
    title: work.mainTitle,
    doi,
    year: year ? Number(year) : null,
    authors: (work.authors ?? []).map(author => author.fullName).filter((name): name is string => !!name),
    abstract: work.descriptions?.find(description => description.trim())?.trim() ?? null,
    topic: null,
    citations: 0,
    workType: "Artículo",
    url,
    pdfUrl: null,
    dccoAffiliationMentioned: false
  };
}

export async function searchOpenAireArticles(input: { idea: string; year?: number; page: number }) {
  let response: Response;
  try {
    response = await fetch(buildOpenAireUrl(input), { signal: AbortSignal.timeout(12000), next: { revalidate: 900 } });
  } catch { throw new Error("OPENAIRE_UNAVAILABLE"); }
  if (!response.ok) throw new Error("OPENAIRE_UNAVAILABLE");
  let payload: OpenAireResponse;
  try { payload = await response.json() as OpenAireResponse; } catch { throw new Error("OPENAIRE_UNAVAILABLE"); }
  if (!Array.isArray(payload.results) || typeof payload.header?.numFound !== "number") throw new Error("OPENAIRE_UNAVAILABLE");
  return {
    items: payload.results.map(mapOpenAireWork).filter((article): article is OpenAlexArticle => !!article),
    total: Math.min(payload.header.numFound, MAX_OPENAIRE_RESULTS),
    page: input.page,
    pageSize: OPENAIRE_PAGE_SIZE
  };
}
