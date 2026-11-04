"use client";

import { useId, useState } from "react";
import type { ComponentProps, KeyboardEvent, ReactNode } from "react";
import { cx } from "../../cx";
import { Button } from "../../primitives/Button";
import { Icon } from "../../primitives/Icon";
import { Input } from "../../primitives/Input";
import { Note } from "../../primitives/Note";
import { Spinner } from "../../primitives/Spinner";
import { Text } from "../../primitives/Text";
import { Textarea } from "../../primitives/Textarea";
import { ContentTypeSelect } from "../ContentTypeSelect";
import type { ContentTypeOption } from "../ContentTypeSelect";
import { ErrorMessage } from "../ErrorMessage";
import styles from "./PromptComposer.module.css";

export type PromptComposerValues = {
  text: string;
  /** Optional; empty string when not provided. */
  sourceUrl: string;
  /** Value of one of `contentTypeOptions`. */
  contentType: string;
};

export type PromptComposerLabels = {
  textLabel: string;
  textPlaceholder: string;
  counter: (count: number) => string;
  warning: (limit: number) => string;
  contentTypeLabel: string;
  /** Discreet action that reveals the URL input, for example "Source URL". */
  sourceUrlAdd: string;
  sourceUrlLabel: string;
  sourceUrlPlaceholder: string;
  sourceUrlInvalid: string;
  sourceUrlRemove: string;
  submit: string;
  submitting: string;
  /** Optional hint announced for the keyboard shortcut, for example "⌘ Enter to generate". */
  shortcutHint?: string;
};

export type PromptComposerError = {
  message: ReactNode;
  /** Concrete recovery action, for example "Try again". */
  action?: { label: string; onClick: () => void };
  /** Stable ID of a system error, shown inside a collapsed <details>. */
  reference?: { summary: string; id: string };
};

export type PromptComposerProps = Omit<
  ComponentProps<"form">,
  "onSubmit" | "onChange" | "children"
> & {
  values: PromptComposerValues;
  onChange: (values: PromptComposerValues) => void;
  onSubmit: (values: PromptComposerValues) => void;
  labels: PromptComposerLabels;
  contentTypeOptions: ContentTypeOption[];
  status?: "idle" | "submitting";
  /** Locks every control (read-only text) without changing the button label. */
  locked?: boolean;
  error?: PromptComposerError;
  warnAt?: number;
  autoFocus?: boolean;
};

export function isValidSourceUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * The single submit rule, shared by the form and any retry: text must be non-empty and the
 * URL, when present, must be http/https. Returns the normalized values, or null if blocked.
 */
export function normalizePromptInput(values: PromptComposerValues): PromptComposerValues | null {
  if (values.text.trim() === "") return null;
  const sourceUrl = values.sourceUrl.trim();
  if (sourceUrl !== "" && !isValidSourceUrl(sourceUrl)) return null;
  return { ...values, sourceUrl };
}

export function PromptComposer({
  values,
  onChange,
  onSubmit,
  labels,
  contentTypeOptions,
  status = "idle",
  locked = false,
  error,
  warnAt = 30000,
  autoFocus = false,
  className,
  ...props
}: PromptComposerProps) {
  // The URL field is open when the user asked for it or when a value exists (for example a
  // draft restored after mount), so a non-empty sourceUrl is never hidden or silently dropped.
  const [urlRequested, setUrlRequested] = useState(false);
  const urlOpen = urlRequested || values.sourceUrl !== "";
  const [urlTouched, setUrlTouched] = useState(false);
  const urlId = useId();
  const urlErrorId = `${urlId}-error`;
  const hintId = `${urlId}-hint`;
  const busy = status === "submitting";
  const readOnly = locked || busy;
  const urlInvalid =
    urlOpen && values.sourceUrl.trim() !== "" && !isValidSourceUrl(values.sourceUrl);
  const showUrlError = urlInvalid && urlTouched;
  const canSubmit = values.text.trim() !== "" && !readOnly;
  const count = values.text.length;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    const normalized = normalizePromptInput(values);
    if (!normalized) {
      setUrlTouched(true);
      return;
    }
    onSubmit(normalized);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form
      {...props}
      className={cx(styles.form, className)}
      onSubmit={handleSubmit}
    >
      <div className={styles.container} data-readonly={readOnly || undefined}>
        <Textarea
          aria-label={labels.textLabel}
          aria-describedby={labels.shortcutHint ? hintId : undefined}
          className={styles.textarea}
          resize="none"
          rows={8}
          autoFocus={autoFocus}
          readOnly={readOnly}
          value={values.text}
          placeholder={labels.textPlaceholder}
          onKeyDown={handleKeyDown}
          onChange={(event) => onChange({ ...values, text: event.target.value })}
        />
        {labels.shortcutHint ? (
          <span id={hintId} className={styles.srOnly}>
            {labels.shortcutHint}
          </span>
        ) : null}
        {urlOpen ? (
          <div className={styles.urlRow}>
            <Input
              type="url"
              inputMode="url"
              autoComplete="off"
              aria-label={labels.sourceUrlLabel}
              aria-invalid={showUrlError}
              aria-describedby={showUrlError ? urlErrorId : undefined}
              placeholder={labels.sourceUrlPlaceholder}
              readOnly={readOnly}
              value={values.sourceUrl}
              onBlur={() => setUrlTouched(true)}
              onChange={(event) => onChange({ ...values, sourceUrl: event.target.value })}
            />
            <button
              type="button"
              className={styles.iconButton}
              aria-label={labels.sourceUrlRemove}
              disabled={readOnly}
              onClick={() => {
                setUrlRequested(false);
                setUrlTouched(false);
                onChange({ ...values, sourceUrl: "" });
              }}
            >
              <Icon name="close" size="sm" />
            </button>
          </div>
        ) : null}
        {showUrlError ? (
          <p id={urlErrorId} role="alert" className={styles.urlError}>
            <Icon name="alert" size="sm" />
            {labels.sourceUrlInvalid}
          </p>
        ) : null}
        <div className={styles.toolbar}>
          <div className={styles.toolbarStart}>
            <ContentTypeSelect
              label={labels.contentTypeLabel}
              options={contentTypeOptions}
              value={values.contentType}
              disabled={readOnly}
              onChange={(contentType) => onChange({ ...values, contentType })}
            />
            {urlOpen ? null : (
              <button
                type="button"
                className={styles.addUrl}
                disabled={readOnly}
                onClick={() => setUrlRequested(true)}
              >
                <span aria-hidden="true">+</span> {labels.sourceUrlAdd}
              </button>
            )}
          </div>
          <div className={styles.toolbarEnd}>
            <Text
              variant="caption"
              tone="muted"
              as="span"
              className={styles.count}
              aria-live="polite"
            >
              {labels.counter(count)}
            </Text>
            <Button variant="accent" type="submit" disabled={!canSubmit}>
              {busy ? (
                <>
                  <Spinner size="sm" label={labels.submitting} />
                  {labels.submitting}
                </>
              ) : (
                labels.submit
              )}
            </Button>
          </div>
        </div>
      </div>
      {count > warnAt ? <Note variant="warning" size="small">{labels.warning(warnAt)}</Note> : null}
      {error ? (
        <ErrorMessage size="small" action={error.action} reference={error.reference}>
          {error.message}
        </ErrorMessage>
      ) : null}
    </form>
  );
}
