"use client";

import type { ComponentProps } from "react";
import { ErrorMessage } from "../ErrorMessage";
import styles from "./ErrorState.module.css";

export type ErrorStateProps = Omit<ComponentProps<"div">, "title"> & {
  title: string;
  description?: string;
  retryLabel: string;
  onRetry: () => void;
  /** Stable ID of a system error (request ID, trace ID); shown inside a collapsed <details>. */
  detail?: string;
  detailLabel?: string;
  /** Move focus to the retry button (full-page route errors). */
  autoFocusRetry?: boolean;
};

export function ErrorState({
  title,
  description,
  retryLabel,
  onRetry,
  detail,
  detailLabel,
  autoFocusRetry = false,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div {...props} className={`${styles.state}${className ? ` ${className}` : ""}`}>
      <ErrorMessage
        size="large"
        live="assertive"
        description={description}
        action={{ label: retryLabel, onClick: onRetry }}
        reference={detail && detailLabel ? { summary: detailLabel, id: detail } : undefined}
        focusAction={autoFocusRetry}
      >
        {title}
      </ErrorMessage>
    </div>
  );
}
