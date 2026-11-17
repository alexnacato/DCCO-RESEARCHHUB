"use client";

import { type FormEvent, useEffect, useState } from "react";
import { BookOpenText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, Th } from "@/components/ui/table";
import { ArticleRow } from "./article-row";
import { apiJson } from "@/lib/client-api";
import type { ArticleAnnotation, ResearchArticle } from "@/features/articles/search";

type Results = {
  items: ResearchArticle[];
  page: number;
  hasNextPage: boolean;
  availableSources: string[];
  unavailableSources: string[];
};

export function ArticleExplorer({ isAdmin }: { isAdmin: boolean }) {
  const [draft, setDraft] = useState("");
  const [idea, setIdea] = useState<string | null>(null);
  const [yearDraft, setYearDraft] = useState("");
  const [year, setYear] = useState("");
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!idea) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ q: idea, year, page: String(page) });
    setLoading(true);
    setError("");
    apiJson<Results>(`/api/articles?${params}`, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setResults(data); })
      .catch(cause => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudieron consultar las fuentes");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [idea, year, page, retry]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const description = draft.trim();
    if (description.length < 10) {
      setIdea(null);
      setResults(null);
      setError("Describe tu idea con al menos 10 caracteres.");
      return;
    }
    setResults(null);
    setError("");
    setLoading(true);
    setPage(1);
    setIdea(description);
    setYear(yearDraft);
    setRetry(value => value + 1);
  }

  function updateAnnotation(key: string, annotation: ArticleAnnotation | null) {
    setResults(current => current ? {
      ...current,
      items: current.items.map(article => article.articleKey === key ? { ...article, annotation } : article)
    } : current);
  }

  function changePage(nextPage: number) {
    setResults(null);
    setLoading(true);
    setPage(nextPage);
  }

  return <div className="space-y-7">
    <header className="max-w-4xl">
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">
        <BookOpenText size={14} aria-hidden="true" /> Investigación ESPE
      </span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Encuentra artículos relacionados con tu idea</h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
        Escribe el tema o problema que quieres investigar. La lista reúne artículos y ponencias de autores afiliados a ESPE encontrados en OpenAlex y OpenAIRE.
      </p>
    </header>

    <form onSubmit={search} className="card space-y-4 border-emerald-100 p-5 md:p-6">
      <div>
        <label htmlFor="research-idea" className="mb-2 block text-sm font-bold text-slate-800">Tu idea de investigación</label>
        <textarea id="research-idea" className="field min-h-28 resize-y text-sm leading-relaxed md:text-base"
          value={draft} onChange={event => setDraft(event.target.value)}
          minLength={10} maxLength={2000}
          placeholder="Ej.: Detectar ataques de phishing en correos universitarios mediante aprendizaje automático."
          required />
        <p className="mt-2 text-xs text-slate-500">Describe la idea en una o dos frases. Puedes escribirla en español.</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-36">
          <label htmlFor="research-year" className="mb-1 block text-xs font-semibold text-slate-700">Año (opcional)</label>
          <Input id="research-year" type="number" min="1900" max={new Date().getFullYear() + 1}
            value={yearDraft} onChange={event => setYearDraft(event.target.value)} placeholder="Todos" />
        </div>
        <Button type="submit" disabled={loading} className="min-w-44">
          <Search size={17} aria-hidden="true" /> {loading ? "Buscando…" : "Buscar artículos"}
        </Button>
      </div>
    </form>

    {!idea && !error && <div className="card flex items-center gap-3 p-5 text-sm text-slate-600">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-brand"><Search size={18} aria-hidden="true" /></span>
      Los resultados aparecerán aquí en una tabla después de enviar tu idea.
    </div>}

    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {error}
      {idea && <button type="button" className="ml-2 font-semibold underline" onClick={() => { setResults(null); setLoading(true); setRetry(value => value + 1); }}>Reintentar</button>}
    </div>}
    {loading && <div role="status" className="card p-8 text-center text-sm text-slate-600">Buscando publicaciones relacionadas con tu idea…</div>}

    {!loading && !error && results && <section aria-labelledby="results-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="results-title" className="text-xl font-bold text-slate-900">Publicaciones encontradas</h2>
          <p className="mt-1 text-sm text-slate-600">{results.items.length} en esta página · Página {page}</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Fuentes disponibles">
          {results.availableSources.map(source => <span key={source} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">{source}</span>)}
        </div>
      </div>
      {results.unavailableSources.length > 0 && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        No se pudo consultar {results.unavailableSources.join(" ni ")}. Se muestran los resultados de la fuente disponible.
      </p>}
      {results.items.length ? <div className="card overflow-hidden">
        <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500 2xl:hidden">Desliza la tabla hacia los lados para ver todas las columnas.</p>
        <Table className="min-w-[1330px] table-fixed">
          <caption className="sr-only">Publicaciones de autores afiliados a ESPE relacionadas con la idea de investigación</caption>
          <colgroup>
            <col className="w-[110px]" /><col className="w-[300px]" /><col className="w-[155px]" />
            <col className="w-[250px]" /><col className="w-[130px]" /><col className="w-[210px]" /><col className="w-[175px]" />
          </colgroup>
          <thead><tr>
            <Th>N.º artículo</Th><Th>Título</Th><Th>DOI</Th><Th>Descripción</Th><Th>Enlace</Th><Th>Línea de investigación</Th><Th>Laboratorio</Th>
          </tr></thead>
          <tbody>{results.items.map(article => <ArticleRow key={`${article.sources[0]}-${article.id}`} article={article} isAdmin={isAdmin} onSaved={updateAnnotation} />)}</tbody>
        </Table>
      </div> : <div className="card p-7 text-center text-sm text-slate-600">
        {results.unavailableSources.length ? "No hubo coincidencias en la fuente disponible." : "No se encontraron publicaciones."} Prueba con otra descripción o quita el filtro de año.
      </div>}
      {(page > 1 || results.hasNextPage) && <nav aria-label="Páginas de resultados" className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" disabled={page <= 1} onClick={() => changePage(page - 1)}>Anterior</Button>
        <span className="text-sm font-medium text-slate-700">Página {page}</span>
        <Button type="button" variant="outline" disabled={!results.hasNextPage || page >= 5} onClick={() => changePage(page + 1)}>Siguiente</Button>
      </nav>}
    </section>}
    <p className="max-w-5xl text-xs leading-relaxed text-slate-500">
      La afiliación a ESPE procede de los metadatos de las fuentes. El DCCO solo se señala cuando figura expresamente. La línea y el laboratorio son asignaciones internas opcionales.
    </p>
  </div>;
}
