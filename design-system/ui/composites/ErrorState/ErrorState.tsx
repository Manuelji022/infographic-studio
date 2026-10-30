"use client";

import type { ComponentProps } from "react";
import { Button } from "../../primitives/Button";
import { Icon } from "../../primitives/Icon";
import { Text } from "../../primitives/Text";
import styles from "./ErrorState.module.css";

export type ErrorStateProps = Omit<ComponentProps<"div">, "title"> & {
  title: string;
  description?: string;
  retryLabel: string;
  onRetry: () => void;
  detail?: string;
};

export function ErrorState({
  title,
  description,
  retryLabel,
  onRetry,
  detail,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div role="alert" className={`${styles.state}${className ? ` ${className}` : ""}`} {...props}>
      <Icon name="alert" className={styles.icon} />
      <Text as="h2" variant="title">{title}</Text>
      {description ? <Text variant="body-sm" tone="muted">{description}</Text> : null}
      {detail ? <Text as="code" variant="code" className={styles.detail}>{detail}</Text> : null}
      <div className={styles.action}>
        <Button variant="outline" onClick={onRetry}>{retryLabel}</Button>
      </div>
    </div>
  );
}
