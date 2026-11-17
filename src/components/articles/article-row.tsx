"use client";

import { Fragment, type FormEvent, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Td } from "@/components/ui/table";
import { apiJson, jsonOptions } from "@/lib/client-api";
import type { ArticleAnnotation, ResearchArticle } from "@/features/articles/search";
import { LABORATORIES, LABORATORIES_SOURCE, RESEARCH_LINES, RESEARCH_LINES_SOURCE } from "@/features/articles/classification-options";

type Props = {
  article: ResearchArticle;
  isAdmin: boolean;
  onSaved: (key: string, annotation: ArticleAnnotation | null) => void;
};

export function ArticleRow({ article, isAdmin, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [researchLine, setResearchLine] = useState(article.annotation?.researchLine ?? "");
  const [laboratory, setLaboratory] = useState(article.annotation?.laboratory ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const editorId = `editor-${article.id.replace(/[^a-zA-Z0-9]/g, "-")}`;

  function toggleEditor() {
    setResearchLine(article.annotation?.researchLine ?? "");
    setLaboratory(article.annotation?.laboratory ?? "");
    setSaveError("");
    setEditing(value => !value);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!article.articleKey || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const result = await apiJson<{ articleKey: string; annotation: ArticleAnnotation | null }>(
        "/api/articles/annotations",
        jsonOptions("POST", { articleKey: article.articleKey, researchLine: researchLine || null, laboratory: laboratory || null })
      );
      onSaved(result.articleKey, result.annotation);
      setEditing(false);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "No se pudo guardar la clasificación");
    } finally { setSaving(false); }
  }

  const doiLabel = article.doi?.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
  const identifier = article.id.split("/").pop();

  return <Fragment>
    <tr className="group border-b border-slate-100 transition-colors hover:bg-emerald-50/40">
      <Td>
        <span title={article.id} className="block break-all font-mono text-[11px] leading-relaxed text-slate-500">{identifier}</span>
      </Td>
      <Td>
        <p className="font-semibold leading-snug text-slate-900">{article.title}</p>
        <p className="mt-1.5 text-xs text-slate-500">{article.workType} · {article.year ?? "Año sin registrar"}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
          {article.authors.length ? article.authors.join(", ") : "Autores no disponibles"}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {article.sources.map(source => <span key={source} className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">{source}</span>)}
          {article.dccoAffiliationMentioned && <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800">DCCO mencionado</span>}
        </div>
      </Td>
      <Td className="break-all">
        {article.doi
          ? <a href={article.doi} title={article.doi} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-brand underline decoration-emerald-300 underline-offset-2 hover:text-dark">{doiLabel}</a>
          : <span className="text-xs text-slate-400">Sin DOI</span>}
      </Td>
      <Td className="text-slate-700">
        {!article.abstract ? <span className="text-xs text-slate-400">Resumen no disponible</span>
          : article.abstract.length <= 180 ? <p className="text-xs leading-relaxed">{article.abstract}</p>
            : <details className="group/abstract text-xs leading-relaxed">
              <summary className="cursor-pointer rounded font-medium text-brand underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">Leer resumen</summary>
              <p className="mt-2 max-h-52 overflow-y-auto whitespace-pre-wrap pr-1 text-slate-700">{article.abstract}</p>
            </details>}
      </Td>
      <Td>
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand underline decoration-emerald-300 underline-offset-2 hover:text-dark">
          Publicación <ExternalLink size={13} aria-hidden="true" />
        </a>
        {article.pdfUrl && <a href={article.pdfUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-brand underline underline-offset-2">PDF abierto</a>}
      </Td>
      <Td>
        {article.annotation?.researchLine
          ? <span className="text-xs font-semibold leading-relaxed text-slate-800">{article.annotation.researchLine}</span>
          : <span className="text-xs text-slate-400">Sin asignar</span>}
        {article.topic && <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">Tema OpenAlex: {article.topic}</p>}
        {article.annotation?.researchLine && <span className="mt-1 block text-[11px] text-emerald-700">Asignación interna</span>}
      </Td>
      <Td>
        {article.annotation?.laboratory
          ? <span className="text-xs font-semibold leading-relaxed text-slate-800">{article.annotation.laboratory}</span>
          : <span className="text-xs text-slate-400">Sin asignar</span>}
        {article.annotation?.laboratory && <span className="mt-1 block text-[11px] text-emerald-700">Asignación interna</span>}
        {isAdmin && article.articleKey && <button type="button" aria-expanded={editing} aria-controls={editorId}
          className="mt-2 block rounded text-xs font-semibold text-brand underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          onClick={toggleEditor}>{editing ? "Cerrar edición" : "Editar clasificación"}</button>}
      </Td>
    </tr>
    {editing && <tr id={editorId}><td colSpan={7} className="border-b border-emerald-100 bg-emerald-50/60 px-5 py-5">
      <form onSubmit={save} className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label htmlFor={`line-${editorId}`} className="mb-1 block text-xs font-semibold">Línea de investigación</label>
          <select id={`line-${editorId}`} className="field" value={researchLine} onChange={event => setResearchLine(event.target.value)}>
            <option value="">Sin asignar</option>
            {RESEARCH_LINES.map(line => <option key={line} value={line}>{line}</option>)}
          </select>
        </div>
        <div className="min-w-56 flex-1">
          <label htmlFor={`lab-${editorId}`} className="mb-1 block text-xs font-semibold">Laboratorio DCCO</label>
          <select id={`lab-${editorId}`} className="field" value={laboratory} onChange={event => setLaboratory(event.target.value)}>
            <option value="">Sin asignar</option>
            {LABORATORIES.map(lab => <option key={lab} value={lab}>{lab}</option>)}
          </select>
        </div>
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
        {saveError && <span role="alert" className="w-full text-sm text-red-700">{saveError}</span>}
        <p className="w-full text-xs text-slate-600">
          Asigna solo datos comprobados. Consulta los listados oficiales de{" "}
          <a href={RESEARCH_LINES_SOURCE} target="_blank" rel="noopener noreferrer" className="font-medium text-brand underline">líneas ESPE</a>
          {" "}y{" "}
          <a href={LABORATORIES_SOURCE} target="_blank" rel="noopener noreferrer" className="font-medium text-brand underline">laboratorios DCCO</a>.
        </p>
      </form>
    </td></tr>}
  </Fragment>;
}
