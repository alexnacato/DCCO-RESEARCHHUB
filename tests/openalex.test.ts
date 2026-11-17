import { afterEach, describe, expect, it, vi } from "vitest";
import { buildOpenAlexUrl, mapOpenAlexWork, reconstructAbstract, searchOpenAlexArticles } from "../src/features/openalex/service";

afterEach(() => vi.unstubAllGlobals());

describe("integración OpenAlex", () => {
  it("busca ideas por significado solo dentro de ESPE y sin ordenar por fecha", () => {
    const idea = "Detección de ataques mediante aprendizaje automático en redes universitarias";
    const url = buildOpenAlexUrl({ idea, year: 2025, page: 2 });
    expect(url.searchParams.get("filter")).toBe("institutions.id:I118946981,type:article|conference-paper,publication_year:2025");
    expect(url.searchParams.get("search.semantic")).toBe(idea);
    expect(url.searchParams.has("sort")).toBe(false);
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("reconstruye el resumen y verifica la afiliación DCCO en el autor de ESPE", () => {
    const article = mapOpenAlexWork({
      id: "https://openalex.org/W123", title: "Artículo de prueba", doi: "https://doi.org/10.1234/test",
      publication_year: 2025, cited_by_count: 3, type: "conference-paper", abstract_inverted_index: { datos: [1], Ciencia: [0] },
      authorships: [
        { author: { display_name: "Ana" }, institutions: [{ id: "https://openalex.org/I118946981" }], raw_affiliation_strings: ["Departamento de Ciencias de la Computación, ESPE"] },
        { author: { display_name: "Luis" }, institutions: [{ id: "https://openalex.org/I999" }], raw_affiliation_strings: [] }
      ], primary_topic: { display_name: "Software" }, primary_location: { landing_page_url: "https://example.org/article" }, best_oa_location: null
    });
    expect(article.abstract).toBe("Ciencia datos");
    expect(article.dccoAffiliationMentioned).toBe(true);
    expect(article.authors).toEqual(["Ana", "Luis"]);
    expect(article.workType).toBe("Ponencia");
    expect(reconstructAbstract(null)).toBeNull();
  });

  it("respeta el máximo de 50 resultados que ofrece la búsqueda semántica", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ meta: { count: 120 }, results: [] }), { status: 200 })));
    const results = await searchOpenAlexArticles({ idea: "Detección de ataques en redes universitarias", page: 1 });
    expect(results.total).toBe(50);
    expect(results.items).toEqual([]);
  });
});
