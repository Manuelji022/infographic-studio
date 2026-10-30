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
    submittingState: "Enviando", submittingCaption: "El formulario muestra el estado de envío.",
    errorState: "Con error", errorCaption: "El error se anuncia como alerta.",
    warningState: "Aviso de longitud",
    warningCaption: "Este ejemplo fuerza el aviso; en la aplicación el umbral real es 30000.",
    interactive: "Interactivo", interactiveCaption: "Edita los campos y envía el formulario.",
    textLabel: "Texto de origen",
    textPlaceholder: "Pega aquí el texto que quieres convertir en infografía.",
    counter: (n: number) => `${n.toLocaleString("es")} caracteres`,
    warning: (limit: number) => `El texto supera el límite de ${limit} caracteres.`,
    optionsSummary: "Opciones", titleLabel: "Título (opcional)",
    sourceUrlLabel: "URL de origen (opcional)", themeLabel: "Tema",
    outputLanguageLabel: "Idioma de salida",
    outputLanguageOptions: { original: "Idioma original", es: "Español", en: "Inglés" },
    submit: "Generar infografía", submitting: "Generando…",
    error: "No se pudo generar la infografía.",
    retry: "Reintentar", refSummary: "Mostrar referencia",
    themes: ["Editorial", "Datos", "Minimal"],
    sample:
      "Las ciudades están creciendo con rapidez. " +
      "El transporte público conecta barrios y empleos. " +
      "Una planificación cuidadosa mejora la calidad de vida.",
    short: "Este texto supera veinte caracteres.",
  },
  en: {
    empty: "Empty", emptyCaption: "Without text, the Generate button is disabled.",
    ready: "Ready to generate", readyCaption: "Example text is ready to submit.",
    submittingState: "Submitting", submittingCaption: "The form shows its submission state.",
    errorState: "With error", errorCaption: "The error is announced as an alert.",
    warningState: "Length warning",
    warningCaption: "This example forces the warning; the real app threshold is 30000.",
    interactive: "Interactive", interactiveCaption: "Edit the fields and submit the form.",
    textLabel: "Source text",
    textPlaceholder: "Paste the text you want to turn into an infographic.",
    counter: (n: number) => `${n.toLocaleString("en")} characters`,
    warning: (limit: number) => `The text exceeds the limit of ${limit} characters.`,
    optionsSummary: "Options", titleLabel: "Title (optional)",
    sourceUrlLabel: "Source URL (optional)", themeLabel: "Theme",
    outputLanguageLabel: "Output language",
    outputLanguageOptions: { original: "Original language", es: "Spanish", en: "English" },
    submit: "Generate infographic", submitting: "Generating…",
    error: "Failed to generate the infographic.",
    retry: "Try again", refSummary: "Show reference",
    themes: ["Editorial", "Data", "Minimal"],
    sample:
      "Cities are growing rapidly. Public transport connects neighborhoods and jobs. " +
      "Careful planning improves quality of life.",
    short: "This text is longer than twenty characters.",
  },
};

const blank = (): PromptComposerValues => ({
  text: "", title: "", sourceUrl: "", theme: "editorial", outputLanguage: "original",
});

export function ComposerSection({ locale }: CatalogSectionProps) {
  const c = copy[locale];
  const labels = {
    textLabel: c.textLabel,
    textPlaceholder: c.textPlaceholder,
    counter: (n: number) =>
      `${n.toLocaleString(locale)} ${locale === "es" ? "caracteres" : "characters"}`,
    warning: c.warning,
    optionsSummary: c.optionsSummary,
    titleLabel: c.titleLabel,
    sourceUrlLabel: c.sourceUrlLabel,
    themeLabel: c.themeLabel,
    outputLanguageLabel: c.outputLanguageLabel,
    outputLanguageOptions: c.outputLanguageOptions,
    submit: c.submit,
    submitting: c.submitting,
  };
  const themeOptions = c.themes.map((label, index) => ({
    value: ["editorial", "data", "minimal"][index], label,
  }));
  const [empty, setEmpty] = useState(blank);
  const [ready, setReady] = useState({ ...blank(), text: c.sample });
  const [sending, setSending] = useState({ ...blank(), text: c.sample });
  const [errored, setErrored] = useState({ ...blank(), text: c.sample });
  const [warning, setWarning] = useState({ ...blank(), text: c.short });
  const [interactive, setInteractive] = useState(blank);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  function submit(values: PromptComposerValues) {
    setStatus("submitting");
    window.setTimeout(() => setStatus("idle"), 1500);
    void values;
  }

  return (
    <div className={styles.layout}>
      <h3 className="ds-type-title">{c.empty}</h3>
      <p className="ds-type-caption">{c.emptyCaption}</p>
      <PromptComposer
        values={empty}
        onChange={setEmpty}
        onSubmit={() => {}}
        labels={labels}
        themeOptions={themeOptions}
      />
      <h3 className="ds-type-title">{c.ready}</h3>
      <p className="ds-type-caption">{c.readyCaption}</p>
      <PromptComposer
        values={ready}
        onChange={setReady}
        onSubmit={() => {}}
        labels={labels}
        themeOptions={themeOptions}
      />
      <h3 className="ds-type-title">{c.submittingState}</h3>
      <p className="ds-type-caption">{c.submittingCaption}</p>
      <PromptComposer
        values={sending}
        onChange={setSending}
        onSubmit={() => {}}
        labels={labels}
        themeOptions={themeOptions}
        status="submitting"
      />
      <h3 className="ds-type-title">{c.errorState}</h3>
      <p className="ds-type-caption">{c.errorCaption}</p>
      <PromptComposer
        values={errored}
        onChange={setErrored}
        onSubmit={() => {}}
        labels={labels}
        themeOptions={themeOptions}
        error={{
          message: c.error,
          action: { label: c.retry, onClick: () => {} },
          reference: { summary: c.refSummary, id: "req_8f3a21c9" },
        }}
      />
      <h3 className="ds-type-title">{c.warningState}</h3>
      <p className="ds-type-caption">{c.warningCaption}</p>
      <PromptComposer
        values={warning}
        onChange={setWarning}
        onSubmit={() => {}}
        labels={labels}
        themeOptions={themeOptions}
        warnAt={20}
      />
      <h3 className="ds-type-title">{c.interactive}</h3>
      <p className="ds-type-caption">{c.interactiveCaption}</p>
      <PromptComposer
        values={interactive}
        onChange={setInteractive}
        onSubmit={submit}
        labels={labels}
        themeOptions={themeOptions}
        status={status}
      />
    </div>
  );
}
