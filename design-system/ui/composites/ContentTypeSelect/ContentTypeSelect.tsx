"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { cx } from "../../cx";
import { Icon } from "../../primitives/Icon";
import styles from "./ContentTypeSelect.module.css";

export type ContentTypeOption = {
  value: string;
  label: string;
  /** One-line description shown under the label in the list. */
  description: string;
};

export type ContentTypeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: ContentTypeOption[];
  /** Accessible name of the control, for example "Content type". */
  label: string;
  disabled?: boolean;
  className?: string;
};

/** Compact single-select with a description per option (a native select cannot show one). */
export function ContentTypeSelect({
  value,
  onChange,
  options,
  label,
  disabled,
  className,
}: ContentTypeSelectProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function openList() {
    if (disabled) return;
    setActive(Math.max(0, options.findIndex((option) => option.value === value)));
    setOpen(true);
  }

  function close(restoreFocus = true) {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }

  function choose(index: number) {
    onChange(options[index].value);
    close();
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const last = options.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((index) => Math.min(index + 1, last));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((index) => Math.max(index - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
        event.preventDefault();
        setActive(last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(active);
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        close();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className={cx(styles.root, className)}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selected?.label ?? ""}`}
        disabled={disabled}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openList();
          }
        }}
      >
        <span>{selected?.label}</span>
        <Icon name="chevron-down" size="sm" className={styles.chevron} />
      </button>
      {open ? (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${baseId}-${active}`}
          className={styles.list}
          onKeyDown={onListKeyDown}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${baseId}-${index}`}
              role="option"
              aria-selected={option.value === value}
              className={cx(styles.option, index === active && styles.active)}
              onPointerEnter={() => setActive(index)}
              onClick={() => choose(index)}
            >
              <span className={styles.optionLabel}>
                {option.label}
                {option.value === value ? <Icon name="check" size="sm" /> : null}
              </span>
              <span className={styles.optionDescription}>{option.description}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
