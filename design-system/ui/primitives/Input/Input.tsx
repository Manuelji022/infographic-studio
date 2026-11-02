"use client";

import type { ComponentProps } from "react";
import { cx } from "../../cx";
import { useFieldControl } from "../Field";
import styles from "./Input.module.css";

export type InputProps = ComponentProps<"input">;

export function Input({ id, className, ...props }: InputProps) {
  const field = useFieldControl();

  return (
    <input
      {...field}
      {...props}
      id={id ?? field.id}
      className={cx(styles.control, className)}
    />
  );
}
