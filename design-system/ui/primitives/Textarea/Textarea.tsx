"use client";

import type { ComponentProps } from "react";
import { cx } from "../../cx";
import { useFieldControl } from "../Field";
import styles from "./Textarea.module.css";

export type TextareaProps = Omit<ComponentProps<"textarea">, "rows"> & {
  rows?: number;
  resize?: "none" | "vertical";
};

export function Textarea({
  id,
  rows = 4,
  resize = "vertical",
  className,
  ...props
}: TextareaProps) {
  const field = useFieldControl();

  return (
    <textarea
      {...field}
      {...props}
      id={id ?? field.id}
      rows={rows}
      className={cx(
        styles.control,
        resize === "none" && styles.noResize,
        className,
      )}
    />
  );
}
