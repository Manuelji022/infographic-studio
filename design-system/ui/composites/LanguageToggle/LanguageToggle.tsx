"use client";

import type { ComponentProps } from "react";
import styles from "./LanguageToggle.module.css";

export type LanguageToggleOption = { value: string; label: string; ariaLabel?: string };
export type LanguageToggleProps = Omit<ComponentProps<"div">, "onChange"> & {
  value: string;
  options: LanguageToggleOption[];
  onChange: (value: string) => void;
  label: string;
};

export function LanguageToggle({
  value,
  options,
  onChange,
  label,
  className,
  ...props
}: LanguageToggleProps) {
  return (
    <div
      {...props}
      role="group"
      aria-label={label}
      className={`${styles.group}${className ? ` ${className}` : ""}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          aria-label={option.ariaLabel}
          className={styles.option}
          onClick={() => {
            if (value !== option.value) onChange(option.value);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
