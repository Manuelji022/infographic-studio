"use client";

import { useState } from "react";
import { catalogSections } from "./registry";
import styles from "./catalog.module.css";
import type { CatalogLocale } from "./types";

type Theme = "auto" | "light" | "dark";

const themes: Theme[] = ["auto", "light", "dark"];
const locales: CatalogLocale[] = ["es", "en"];

export function CatalogShell() {
  const [theme, setTheme] = useState<Theme>("auto");
  const [locale, setLocale] = useState<CatalogLocale>("es");

  return (
    <div className={styles.stage} data-ds-theme={theme}>
      <header className={styles.toolbar}>
        <h1 className="ds-type-subheading-sans">Design system</h1>
        <div className={styles.group} role="group" aria-label="Theme">
          {themes.map((value) => (
            <button
              key={value}
              type="button"
              className={styles.toggle}
              aria-pressed={theme === value}
              onClick={() => setTheme(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <div className={styles.group} role="group" aria-label="Sample language">
          {locales.map((value) => (
            <button
              key={value}
              type="button"
              className={styles.toggle}
              aria-pressed={locale === value}
              onClick={() => setLocale(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </header>
      <main className={styles.content}>
        {catalogSections.map(({ id, title, Component }) => (
          <section key={id} id={id} className={styles.section}>
            <h2 className="ds-type-subheading-serif">{title[locale]}</h2>
            <Component locale={locale} />
          </section>
        ))}
      </main>
    </div>
  );
}
