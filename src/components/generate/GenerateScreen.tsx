"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  GenerationProgress,
  PromptComposer,
  Text,
  normalizePromptInput,
  type GenerationStep,
  type PromptComposerValues,
} from "@ds/ui";
import { getMessages, type Locale } from "../../../messages";
import { generateInfographic, type MockFlag } from "../../mocks/actions";
import { CONTENT_TYPES, DEFAULT_CONTENT_TYPE, SOFT_CHAR_LIMIT } from "../../mocks/content-types";
import type { ContentTypeId } from "../../mocks/types";
import { EXAMPLE_CONTENT_TYPE, EXAMPLE_TEXTS, type ExampleId } from "./examples";
import styles from "./GenerateScreen.module.css";

const STEP_MS = 2000;
const STORAGE_KEY = "generate:draft";
const EXAMPLE_IDS: ExampleId[] = ["article", "interview", "financial"];
const STEP_KEYS = ["stepRead", "stepNarrative", "stepCompose", "stepReview"] as const;

type Phase = "idle" | "generating" | "error";

function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

function readDraft(): PromptComposerValues | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PromptComposerValues) : null;
  } catch {
    return null;
  }
}

function writeDraft(values: PromptComposerValues | null) {
  try {
    if (values) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Draft persistence is best-effort.
  }
}

export function GenerateScreen({ locale, mock }: { locale: Locale; mock?: MockFlag }) {
  const messages = getMessages(locale);
  const router = useRouter();
  const [values, setValues] = useState<PromptComposerValues>({
    text: "",
    sourceUrl: "",
    contentType: DEFAULT_CONTENT_TYPE,
  });
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [errorRef, setErrorRef] = useState<string | undefined>();
  const runRef = useRef(0);
  const draftLoaded = useRef(false);

  // Restore an unsaved draft after hydration (sessionStorage does not exist on the server).
  useEffect(() => {
    const draft = readDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot restore after mount
    if (draft) setValues(draft);
    draftLoaded.current = true;
  }, []);

  useEffect(() => {
    if (draftLoaded.current) writeDraft(values.text ? values : null);
  }, [values]);

  // Advance the visible steps on a client timer; the last one stays active until the action resolves.
  useEffect(() => {
    if (phase !== "generating") return;
    const timer = window.setInterval(
      () => setStepIndex((index) => Math.min(index + 1, STEP_KEYS.length - 1)),
      STEP_MS,
    );
    return () => window.clearInterval(timer);
  }, [phase]);

  /** Every entry point (form submit and Retry) passes through the same rule. */
  function start(input: PromptComposerValues) {
    const normalized = normalizePromptInput(input);
    if (normalized) void submit(normalized);
  }

  async function submit(input: PromptComposerValues) {
    const run = ++runRef.current;
    setPhase("generating");
    setStepIndex(0);
    setErrorRef(undefined);
    let result: Awaited<ReturnType<typeof generateInfographic>>;
    try {
      result = await generateInfographic(
        {
          text: input.text,
          sourceUrl: input.sourceUrl || undefined,
          contentType: input.contentType as ContentTypeId,
        },
        mock,
      );
    } catch {
      result = { ok: false, error: { message: "network_error" } };
    }
    if (run !== runRef.current) return; // cancelled: ignore the late result
    if (result.ok) {
      writeDraft(null);
      router.push(`/i/${result.data.id}`);
    } else {
      setErrorRef(result.error.reference);
      setPhase("error");
    }
  }

  function cancel() {
    runRef.current += 1;
    setPhase("idle");
  }

  const steps: GenerationStep[] = STEP_KEYS.map((key, index) => {
    const status = index < stepIndex ? "done" : index === stepIndex ? "active" : "pending";
    return {
      key,
      label: messages[key],
      status,
      statusLabel:
        status === "done"
          ? messages.stepStatusDone
          : status === "active"
            ? messages.stepStatusActive
            : messages.stepStatusPending,
    };
  });

  const labels = useMemo(
    () => ({
      textLabel: messages.generateTextLabel,
      textPlaceholder: messages.generatePlaceholder,
      counter: (count: number) =>
        fill(messages.generateCounter, {
          count: count.toLocaleString(locale),
          limit: SOFT_CHAR_LIMIT.toLocaleString(locale),
        }),
      warning: (limit: number) =>
        fill(messages.generateLimitWarning, { limit: limit.toLocaleString(locale) }),
      contentTypeLabel: messages.contentTypeLabel,
      sourceUrlAdd: messages.sourceUrlAdd,
      sourceUrlLabel: messages.sourceUrlLabel,
      sourceUrlPlaceholder: messages.sourceUrlPlaceholder,
      sourceUrlInvalid: messages.sourceUrlInvalid,
      sourceUrlRemove: messages.sourceUrlRemove,
      submit: messages.generateSubmit,
      submitting: messages.generateSubmitting,
      shortcutHint: messages.generateShortcutHint,
    }),
    [messages, locale],
  );

  const contentTypeOptions = CONTENT_TYPES.map((type) => ({
    value: type.id,
    label: messages[type.labelKey],
    description: messages[type.descriptionKey],
  }));

  const generating = phase === "generating";

  return (
    <main className={styles.main}>
      <div className={styles.column}>
        <h1 className={`ds-type-display ${styles.headline}`}>{messages.generateHeadline}</h1>
        <PromptComposer
          autoFocus
          values={values}
          onChange={setValues}
          onSubmit={start}
          labels={labels}
          contentTypeOptions={contentTypeOptions}
          status={generating ? "submitting" : "idle"}
          warnAt={SOFT_CHAR_LIMIT}
          error={
            phase === "error"
              ? {
                  message: messages.generateError,
                  // Offer Retry only while the input would pass the same rule as submit.
                  action: normalizePromptInput(values)
                    ? { label: messages.retry, onClick: () => start(values) }
                    : undefined,
                  reference: errorRef
                    ? { summary: messages.errorReferenceSummary, id: errorRef }
                    : undefined,
                }
              : undefined
          }
        />
        {generating ? (
          <div className={styles.progress}>
            <GenerationProgress label={messages.generateStepsLabel} steps={steps} />
            <Button variant="outline" size="sm" onClick={cancel}>
              {messages.generateCancel}
            </Button>
          </div>
        ) : (
          <div className={styles.examples}>
            <Text variant="caption" tone="muted" as="span">
              {messages.generateExamplesLabel}
            </Text>
            <ul className={styles.chips}>
              {EXAMPLE_IDS.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    className={styles.chip}
                    onClick={() => {
                      setValues({
                        text: EXAMPLE_TEXTS[id][locale],
                        sourceUrl: "",
                        contentType: EXAMPLE_CONTENT_TYPE[id],
                      });
                      if (phase === "error") setPhase("idle");
                    }}
                  >
                    {id === "article"
                      ? messages.generateExampleArticle
                      : id === "interview"
                        ? messages.generateExampleInterview
                        : messages.generateExampleFinancial}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
