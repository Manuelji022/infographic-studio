"use client";

import { useState } from "react";
import { PromptComposer } from "../../ui/composites/PromptComposer";
import type { PromptComposerValues } from "../../ui/composites/PromptComposer";
import type { CatalogSectionProps } from "../types";
import styles from "./ComposerSection.module.css";

const copy = {
  es: {
    empty: "Vacío", emptyCaption: "Sin texto, el botón Generar está deshabilitado.",
    ready: "Listo para generar", readyCaption: "Texto de ejemplo listo para enviar.",
    urlState: "Con URL de origen", urlCaption: "La URL se valida solo en formato (http/https).",
    submittingState: "Generando", submittingCaption: "El compositor queda en solo lectura.",
    errorState: "Con error", errorCaption: "El texto se conserva y se ofrece reintentar.",
    warningState: "Aviso de longitud",
    warningCaption: "Este ejemplo fuerza el aviso; en la aplicación el umbral real es 30000.",
    interactive: "Interactivo",
    interactiveCaption: "Escribe, cambia el tipo, añade una URL y envía con ⌘/Ctrl + Enter.",
    textLabel: "Texto de origen",
    textPlaceholder: "Pega aquí un artículo, una entrevista o un informe financiero…",
    warning: (limit: number) => `El texto supera el límite sugerido de ${limit} caracteres.`,
    contentTypeLabel: "Tipo de contenido",
    types: [
      ["Auto", "Detecta el tipo de contenido automáticamente"],
      ["Entrevista", "Transcripciones, conversaciones y preguntas y respuestas"],
      ["Artículo", "Artículos, ensayos y contenido editorial"],
      ["Estado financiero", "Informes y resultados de empresas, datos financieros"],
    ],
    sourceUrlAdd: "URL de origen", sourceUrlLabel: "URL de origen (opcional)",
    sourceUrlPlaceholder: "https://…",
    sourceUrlInvalid: "Introduce una URL válida que empiece por http:// o https://.",
    sourceUrlRemove: "Quitar URL de origen",
    submit: "Generar", submitting: "Generando",
    shortcutHint: "⌘ Enter para generar",
    error: "No se pudo generar la infografía. Se ha conservado tu texto.",
    retry: "Reintentar", refSummary: "Referencia del error",
    sample:
      "Las ciudades están creciendo con rapidez. " +
      "El transporte público conecta barrios y empleos. " +
      "Una planificación cuidadosa mejora la calidad de vida.",
    short: "Este texto supera veinte caracteres.",
    characters: "caracteres",
  },
  en: {
    empty: "Empty", emptyCaption: "Without text, the Generate button is disabled.",
    ready: "Ready to generate", readyCaption: "Example text is ready to submit.",
    urlState: "With source URL", urlCaption: "The URL is validated for format only (http/https).",
    submittingState: "Generating", submittingCaption: "The composer is read-only.",
    errorState: "With error", errorCaption: "The text is kept and a retry is offered.",
    warningState: "Length warning",
    warningCaption: "This example forces the warning; the real app threshold is 30000.",
    interactive: "Interactive",
    interactiveCaption: "Type, change the type, add a URL and submit with ⌘/Ctrl + Enter.",
    textLabel: "Source text",
    textPlaceholder: "Paste an article, an interview or a financial report here…",
    warning: (limit: number) => `The text exceeds the suggested limit of ${limit} characters.`,
    contentTypeLabel: "Content type",
    types: [
      ["Auto", "Detects the content type automatically"],
      ["Interview", "Transcripts, conversations and Q&A"],
      ["Article", "Articles, essays and editorial content"],
      ["Financial statement", "Company reports and results, financial data"],
    ],
    sourceUrlAdd: "Source URL", sourceUrlLabel: "Source URL (optional)",
    sourceUrlPlaceholder: "https://…",
    sourceUrlInvalid: "Enter a valid URL starting with http:// or https://.",
    sourceUrlRemove: "Remove source URL",
    submit: "Generate", submitting: "Generating",
    shortcutHint: "⌘ Enter to generate",
    error: "Could not generate the infographic. Your text has been kept.",
    retry: "Try again", refSummary: "Error reference",
    sample:
      "Cities are growing rapidly. Public transport connects neighborhoods and jobs. " +
      "Careful planning improves quality of life.",
    short: "This text is longer than twenty characters.",
    characters: "characters",
  },
};

const blank = (): PromptComposerValues => ({ text: "", sourceUrl: "", contentType: "auto" });

export function ComposerSection({ locale }: CatalogSectionProps) {
  const c = copy[locale];
  const labels = {
    textLabel: c.textLabel,
    textPlaceholder: c.textPlaceholder,
    counter: (n: number) => `${n.toLocaleString(locale)} / 30.000 ${c.characters}`,
    warning: c.warning,
    contentTypeLabel: c.contentTypeLabel,
    sourceUrlAdd: c.sourceUrlAdd,
    sourceUrlLabel: c.sourceUrlLabel,
    sourceUrlPlaceholder: c.sourceUrlPlaceholder,
    sourceUrlInvalid: c.sourceUrlInvalid,
    sourceUrlRemove: c.sourceUrlRemove,
    submit: c.submit,
    submitting: c.submitting,
    shortcutHint: c.shortcutHint,
  };
  const contentTypeOptions = c.types.map(([label, description], index) => ({
    value: ["auto", "interview", "article", "financial"][index], label, description,
  }));
  const [empty, setEmpty] = useState(blank);
  const [ready, setReady] = useState({ ...blank(), text: c.sample });
  const [withUrl, setWithUrl] = useState({
    ...blank(), text: c.sample, sourceUrl: "ejemplo",
  });
  const [sending, setSending] = useState({ ...blank(), text: c.sample });
  const [errored, setErrored] = useState({ ...blank(), text: c.sample });
  const [warning, setWarning] = useState({ ...blank(), text: c.short });
  const [interactive, setInteractive] = useState(blank);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  function submit() {
    setStatus("submitting");
    window.setTimeout(() => setStatus("idle"), 1500);
  }

  const shared = { labels, contentTypeOptions };

  return (
    <div className={styles.layout}>
      <h3 className="ds-type-title">{c.empty}</h3>
      <p className="ds-type-caption">{c.emptyCaption}</p>
      <PromptComposer {...shared} values={empty} onChange={setEmpty} onSubmit={() => {}} />
      <h3 className="ds-type-title">{c.ready}</h3>
      <p className="ds-type-caption">{c.readyCaption}</p>
      <PromptComposer {...shared} values={ready} onChange={setReady} onSubmit={() => {}} />
      <h3 className="ds-type-title">{c.urlState}</h3>
      <p className="ds-type-caption">{c.urlCaption}</p>
      <PromptComposer {...shared} values={withUrl} onChange={setWithUrl} onSubmit={() => {}} />
      <h3 className="ds-type-title">{c.submittingState}</h3>
      <p className="ds-type-caption">{c.submittingCaption}</p>
      <PromptComposer
        {...shared}
        values={sending}
        onChange={setSending}
        onSubmit={() => {}}
        status="submitting"
      />
      <h3 className="ds-type-title">{c.errorState}</h3>
      <p className="ds-type-caption">{c.errorCaption}</p>
      <PromptComposer
        {...shared}
        values={errored}
        onChange={setErrored}
        onSubmit={() => {}}
        error={{
          message: c.error,
          action: { label: c.retry, onClick: () => {} },
          reference: { summary: c.refSummary, id: "req_8f3a21c9" },
        }}
      />
      <h3 className="ds-type-title">{c.warningState}</h3>
      <p className="ds-type-caption">{c.warningCaption}</p>
      <PromptComposer
        {...shared}
        values={warning}
        onChange={setWarning}
        onSubmit={() => {}}
        warnAt={20}
      />
      <h3 className="ds-type-title">{c.interactive}</h3>
      <p className="ds-type-caption">{c.interactiveCaption}</p>
      <PromptComposer
        {...shared}
        values={interactive}
        onChange={setInteractive}
        onSubmit={submit}
        status={status}
      />
    </div>
  );
}
