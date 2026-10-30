"use client";

import { useRef } from "react";
import type { ComponentProps } from "react";
import { Button } from "../../primitives/Button";
import { Icon } from "../../primitives/Icon";
import { Input } from "../../primitives/Input";
import styles from "./SearchBar.module.css";

export type SearchBarProps = Omit<ComponentProps<"form">, "onSubmit" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  label: string;
  placeholder?: string;
  clearLabel: string;
  submitLabel: string;
};

export function SearchBar({
  value, onChange, onSubmit, label, placeholder, clearLabel, submitLabel,
  className, ...props
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <form
      {...props}
      role="search"
      className={`${styles.form}${className ? ` ${className}` : ""}`}
      onSubmit={(event) => { event.preventDefault(); onSubmit?.(value); }}
    >
      <div className={styles.control}>
        <Icon name="search" className={styles.searchIcon} />
        <Input
          ref={inputRef}
          type="search"
          aria-label={label}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          className={styles.input}
        />
        {value ? (
          <button
            type="button"
            className={styles.clear}
            aria-label={clearLabel}
            onClick={() => { onChange(""); inputRef.current?.focus(); }}
          >
            <Icon name="close" />
          </button>
        ) : null}
      </div>
      <Button variant="ivory" size="sm" type="submit" className={styles.submit}>
        <span className={styles.submitText}>{submitLabel}</span>
      </Button>
    </form>
  );
}
