"use client";

import { useEffect, useRef } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "../../primitives/Button";
import { Icon } from "../../primitives/Icon";
import { Link } from "../../primitives/Link";
import { cx } from "../../cx";
import styles from "./ErrorMessage.module.css";

export type ErrorMessageSize = "small" | "default" | "large";

export type ErrorMessageProps = Omit<ComponentProps<"div">, "children"> & {
  children: ReactNode;
  /** Bold prefix, for example the name of the failed resource. */
  label?: string;
  size?: ErrorMessageSize;
  /** Supporting sentence: what to do next. */
  description?: string;
  /** Concrete recovery action ("Try again"). */
  action?: { label: string; onClick: () => void };
  link?: { label: string; href: string };
  /** Stable ID for system errors, shown in monospace inside a collapsed <details>. */
  reference?: { summary: string; id: string };
  /** Move focus to the action when the error appears (full-page route errors). */
  focusAction?: boolean;
  /** "polite" for asynchronous errors, "assertive" only when blocking input. */
  live?: "polite" | "assertive";
};

export function ErrorMessage({
  children,
  label,
  size = "default",
  description,
  action,
  link,
  reference,
  focusAction = false,
  live = "polite",
  className,
  ...props
}: ErrorMessageProps) {
  const actionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (focusAction) actionRef.current?.focus();
  }, [focusAction]);

  return (
    <div
      aria-live={live}
      {...props}
      className={cx(styles.root, styles[size], className)}
    >
      <div className={styles.message}>
        <Icon name="alert" className={styles.icon} />
        <p className={styles.text}>
          {label ? <strong className={styles.label}>{label}: </strong> : null}
          {children}
        </p>
      </div>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action || link ? (
        <div className={styles.actions}>
          {action ? (
            <Button ref={actionRef} variant="outline" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          ) : null}
          {link ? <Link href={link.href}>{link.label}</Link> : null}
        </div>
      ) : null}
      {reference ? (
        <details className={styles.reference}>
          <summary>{reference.summary}</summary>
          <code className={styles.code}>{reference.id}</code>
        </details>
      ) : null}
    </div>
  );
}
