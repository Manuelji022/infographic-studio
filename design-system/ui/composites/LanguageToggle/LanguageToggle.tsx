"use client";

import { useId, useRef } from "react";
import type { ComponentProps, CSSProperties } from "react";
import { Icon } from "../../primitives/Icon";
import styles from "./LanguageToggle.module.css";

export type LanguageToggleOption = { value: string; label: string; ariaLabel?: string };
export type LanguageToggleProps = Omit<ComponentProps<"div">, "onChange"> & {
  value: string;
  options: LanguageToggleOption[];
  onChange: (value: string) => void;
  label: string;
};

const nameOf = (option: LanguageToggleOption) => option.ariaLabel ?? option.label;

export function LanguageToggle({
  value,
  options,
  onChange,
  label,
  className,
  ...props
}: LanguageToggleProps) {
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const currentIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const current = options[currentIndex];
  const rootClass = `${styles.root}${className ? ` ${className}` : ""}`;

  if (!current) return null;

  // Two languages: the button switches straight to the other one.
  if (options.length <= 2) {
    const next = options[(currentIndex + 1) % options.length];
    return (
      <div {...props} className={rootClass}>
        <button
          type="button"
          className={styles.trigger}
          aria-label={`${label}: ${nameOf(next)}`}
          onClick={() => {
            if (next.value !== value) onChange(next.value);
          }}
        >
          <Icon name="globe" size="sm" />
          <span className={styles.code}>{current.label}</span>
        </button>
      </div>
    );
  }

  // Three or more: the button opens a menu of every language.
  // One anchor name per instance so several toggles on a page do not share an anchor.
  const anchor = `--ds-language-toggle-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <div {...props} className={rootClass}>
      <button
        type="button"
        popoverTarget={id}
        className={styles.trigger}
        aria-label={`${label}: ${nameOf(current)}`}
        style={{ anchorName: anchor } as CSSProperties}
      >
        <Icon name="globe" size="sm" />
        <span className={styles.code}>{current.label}</span>
        <Icon name="chevron-down" size="sm" />
      </button>
      <div
        id={id}
        ref={panelRef}
        popover="auto"
        aria-label={label}
        className={styles.panel}
        style={{ positionAnchor: anchor } as CSSProperties}
      >
        <ul className={styles.items}>
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className={styles.item}
                aria-current={option.value === value ? "true" : undefined}
                onClick={() => {
                  if (option.value !== value) onChange(option.value);
                  panelRef.current?.hidePopover();
                }}
              >
                <span>{nameOf(option)}</span>
                {option.value === value ? <Icon name="check" size="sm" /> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
