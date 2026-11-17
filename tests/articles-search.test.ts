import { afterEach, describe, expect, it, vi } from "vitest";
import { buildOpenAireUrl, mapOpenAireWork, searchOpenAireArticles } from "../src/features/openaire/service";
import { articleKey, mergeArticles, searchArticles } from "../src/features/articles/search";
import type { OpenAlexArticle } from "../src/features/openalex/service";

afterEach(() => vi.unstubAllGlobals());

describe("búsqueda en OpenAIRE", () => {
  it("filtra artículos por afiliación de autor a ESPE y año", () => {
    const url = buildOpenAireUrl({ idea: "aprendizaje automático", year: 2024, page: 2 });
    expect(url.searchParams.get("filter")).toBe("type:publication,instance_type:Article,authorships.institutions.ror:https://ror.org/05j136930,from_publication_year:2024,to_publication_year:2024");
    expect(url.searchParams.get("search")).toBe("aprendizaje automático");
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("adapta DOI, autores, resumen y enlace sin inventar laboratorio", () => {
    const article = mapOpenAireWork({
      id: "doi_dedup___::abc", mainTitle: "Seguridad en redes", publicationDate: "2024-05-01",
      pids: [{ scheme: "doi", value: "10.1234/example" }], descriptions: ["Resumen verificado"],
      authors: [{ fullName: "Ana Pérez" }], instances: [{ type: "Article", urls: ["https://example.org/article"] }]
    });
    expect(article).toMatchObject({ doi: "https://doi.org/10.1234/example", year: 2024, authors: ["Ana Pérez"], abstract: "Resumen verificado", dccoAffiliationMentioned: false });
    expect(mapOpenAireWork({ id: "x", mainTitle: "Sin enlace" })).toBeNull();
  });

  it("acepta respuestas válidas y limita resultados a 50", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ header: { numFound: 140 }, results: [] }), { status: 200 })));
    const result = await searchOpenAireArticles({ idea: "seguridad de redes", page: 1 });
    expect(result.total).toBe(50);
  });
});

describe("combinación de fuentes", () => {
  it("elimina DOI duplicados y completa el resumen faltante", () => {
    const base: OpenAlexArticle = {
      id: "W1", title: "Artículo", doi: "https://doi.org/10.1234/ABC", year: 2024,
      authors: [], abstract: null, topic: null, citations: 0, workType: "Artículo",
      url: "https://example.org", pdfUrl: null, dccoAffiliationMentioned: false
    };
    const result = mergeArticles([base], [{ ...base, id: "other", doi: "https://doi.org/10.1234/abc", abstract: "Resumen" }]);
    expect(result).toHaveLength(1);
    expect(result[0].sources).toEqual(["OpenAlex", "OpenAIRE"]);
    expect(result[0].abstract).toBe("Resumen");
    expect(articleKey(result[0])).toBe("doi:10.1234/abc");
  });

  it("mantiene resultados si una API no responde", async () => {
    vi.stubGlobal("fetch", vi.fn((url: URL) => url.hostname === "api.openalex.org"
      ? Promise.reject(new Error("sin conexión"))
      : Promise.resolve(new Response(JSON.stringify({ header: { numFound: 1 }, results: [{
        id: "doi_dedup___::abc", mainTitle: "Redes universitarias", pids: [{ scheme: "doi", value: "10.1234/redes" }]
      }] }), { status: 200 }))));
    const result = await searchArticles({ idea: "Seguridad en redes universitarias", page: 1 });
    expect(result.items).toHaveLength(1);
    expect(result.availableSources).toEqual(["OpenAIRE"]);
    expect(result.unavailableSources).toEqual(["OpenAlex"]);
  });

  it("indica error cuando ambas fuentes fallan", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("sin conexión")));
    await expect(searchArticles({ idea: "Seguridad en redes universitarias", page: 1 })).rejects.toThrow("SEARCH_UNAVAILABLE");
  });
});
