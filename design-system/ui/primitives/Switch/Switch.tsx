"use client";
import type { ComponentProps, ReactNode } from "react";
import { useFieldControl } from "../Field";
import styles from "./Switch.module.css";

export type SwitchProps = Omit<ComponentProps<"input">, "type"> & {
  children: ReactNode;
};

export function Switch({ children, id, ...props }: SwitchProps) {
  const field = useFieldControl();

  return (
    <label className={styles.label}>
      <input
        {...field}
        {...props}
        id={id ?? field.id}
        type="checkbox"
        role="switch"
        className={styles.control}
      />
      <span>{children}</span>
    </label>
  );
}
