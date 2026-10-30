"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button } from "../../primitives/Button";
import { Callout } from "../../primitives/Callout";
import { Field } from "../../primitives/Field";
import { Icon } from "../../primitives/Icon";
import { Input } from "../../primitives/Input";
import { Select } from "../../primitives/Select";
import { Spinner } from "../../primitives/Spinner";
import { Text } from "../../primitives/Text";
import { Textarea } from "../../primitives/Textarea";
import styles from "./PromptComposer.module.css";

export type OutputLanguage = "original" | "es" | "en";

export type PromptComposerValues = {
  text: string;
  title: string;
  sourceUrl: string;
  theme: string;
  outputLanguage: OutputLanguage;
};

export type PromptComposerLabels = {
  textLabel: string;
  textPlaceholder: string;
  counter: (count: number) => string;
  warning: (limit: number) => string;
  optionsSummary: string;
  titleLabel: string;
  sourceUrlLabel: string;
  themeLabel: string;
  outputLanguageLabel: string;
  outputLanguageOptions: Record<OutputLanguage, string>;
  submit: string;
  submitting: string;
};

export type PromptComposerProps = Omit<
  ComponentProps<"form">,
  "onSubmit" | "onChange" | "children"
> & {
  values: PromptComposerValues;
  onChange: (values: PromptComposerValues) => void;
  onSubmit: (values: PromptComposerValues) => void;
  labels: PromptComposerLabels;
  themeOptions: Array<{ value: string; label: string }>;
  status?: "idle" | "submitting";
  error?: ReactNode;
  warnAt?: number;
};

export function PromptComposer({
  values,
  onChange,
  onSubmit,
  labels,
  themeOptions,
  status = "idle",
  error,
  warnAt = 30000,
  className,
  ...props
}: PromptComposerProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form
      {...props}
      className={[styles.form, className].filter(Boolean).join(" ")}
      onSubmit={handleSubmit}
    >
      <Field label={labels.textLabel}>
        <Textarea
          rows={10}
          value={values.text}
          placeholder={labels.textPlaceholder}
          onChange={(event) => onChange({ ...values, text: event.target.value })}
        />
      </Field>
      <div className={styles.counter}>
        <Text variant="caption" aria-live="polite">
          {labels.counter(values.text.length)}
        </Text>
        {values.text.length > warnAt && (
          <Callout variant="highlight">{labels.warning(warnAt)}</Callout>
        )}
      </div>
      <details className={styles.options}>
        <summary className={`ds-type-ui-medium ${styles.summary}`}>
          {labels.optionsSummary}
          <Icon name="chevron-down" className={styles.chevron} />
        </summary>
        <div className={styles.grid}>
          <Field label={labels.titleLabel}>
            <Input
              value={values.title}
              maxLength={200}
              onChange={(event) => onChange({ ...values, title: event.target.value })}
            />
          </Field>
          <Field label={labels.sourceUrlLabel}>
            <Input
              type="url"
              value={values.sourceUrl}
              onChange={(event) => onChange({ ...values, sourceUrl: event.target.value })}
            />
          </Field>
          <Field label={labels.themeLabel}>
            <Select
              value={values.theme}
              onChange={(event) => onChange({ ...values, theme: event.target.value })}
            >
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={labels.outputLanguageLabel}>
            <Select
              value={values.outputLanguage}
              onChange={(event) =>
                onChange({
                  ...values,
                  outputLanguage: event.target.value as OutputLanguage,
                })
              }
            >
              {(["original", "es", "en"] as const).map((language) => (
                <option key={language} value={language}>
                  {labels.outputLanguageOptions[language]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </details>
      {error != null && <Callout role="alert">{error}</Callout>}
      <div className={styles.actions}>
        <Button
          variant="accent"
          type="submit"
          disabled={values.text.trim() === "" || status === "submitting"}
        >
          {status === "submitting" ? (
            <>
              <Spinner size="sm" label={labels.submitting} />
              {labels.submitting}
            </>
          ) : (
            labels.submit
          )}
        </Button>
      </div>
    </form>
  );
}
