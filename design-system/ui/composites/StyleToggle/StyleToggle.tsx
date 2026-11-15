"use client";

import type { ComponentProps } from "react";
import styles from "./StyleToggle.module.css";

export type StyleToggleOption = { value: string; label: string; ariaLabel?: string };
export type StyleToggleProps = Omit<ComponentProps<"div">, "onChange"> & {
  value: string;
  options: StyleToggleOption[];
  onChange: (value: string) => void;
  label: string;
};

export function StyleToggle({
  value,
  options,
  onChange,
  label,
  className,
  ...props
}: StyleToggleProps) {
  return (
    <div
      {...props}
      role="group"
      aria-label={label}
      className={`${styles.root}${className ? ` ${className}` : ""}`}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={styles.option}
            aria-pressed={selected}
            aria-label={option.ariaLabel}
            onClick={() => {
              if (!selected) onChange(option.value);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
