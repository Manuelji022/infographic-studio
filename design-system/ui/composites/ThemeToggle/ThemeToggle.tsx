"use client";

import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { Icon } from "../../primitives/Icon";
import styles from "./ThemeToggle.module.css";

export type ThemeValue = "light" | "dark";
export type ThemeToggleProps = Omit<ComponentProps<"div">, "onChange"> & {
  /** Saved choice; "auto" means follow the system until the user picks one. */
  value: ThemeValue | "auto";
  onChange: (value: ThemeValue) => void;
  label: string;
  lightLabel: string;
  darkLabel: string;
};

export function ThemeToggle({
  value,
  onChange,
  label,
  lightLabel,
  darkLabel,
  className,
  ...props
}: ThemeToggleProps) {
  // With "auto" the server cannot know the system theme, so resolve it after mount.
  const [system, setSystem] = useState<ThemeValue | null>(null);
  useEffect(() => {
    if (value !== "auto") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setSystem(query.matches ? "dark" : "light");
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [value]);

  const current = value === "auto" ? system : value;
  const options = [
    { value: "light" as const, label: lightLabel, icon: "sun" as const },
    { value: "dark" as const, label: darkLabel, icon: "moon" as const },
  ];

  return (
    <div
      {...props}
      role="group"
      aria-label={label}
      className={`${styles.root}${className ? ` ${className}` : ""}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={option.label}
          aria-pressed={current === option.value}
          className={styles.segment}
          onClick={() => {
            if (current !== option.value) onChange(option.value);
          }}
        >
          <Icon name={option.icon} size="sm" />
        </button>
      ))}
    </div>
  );
}
