"use client";

import type { ComponentProps, ReactNode } from "react";
import { cx } from "../../cx";
import { useFieldControl } from "../Field";
import styles from "./Checkbox.module.css";

export type CheckboxProps = Omit<ComponentProps<"input">, "type"> & {
  children: ReactNode;
};

export function Checkbox({
  children,
  id,
  className,
  ...props
}: CheckboxProps) {
  const field = useFieldControl();

  return (
    <label className={cx(styles.label, className)}>
      <input
        {...field}
        {...props}
        id={id ?? field.id}
        type="checkbox"
        className={styles.control}
      />
      <span>{children}</span>
    </label>
  );
}
