"use client";

import type { ComponentProps } from "react";
import { cx } from "../../cx";
import { useFieldControl } from "../Field";
import styles from "./Select.module.css";

export type SelectProps = ComponentProps<"select">;

export function Select({ id, className, ...props }: SelectProps) {
  const field = useFieldControl();

  return (
    <span className={styles.root}>
      <select
        {...field}
        {...props}
        id={id ?? field.id}
        className={cx(styles.control, className)}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className={styles.chevron}
      >
        <path d="m4 6 4 4 4-4" />
      </svg>
    </span>
  );
}
