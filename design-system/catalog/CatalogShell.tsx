"use client";

import { useState } from "react";
import { Icon } from "../ui/primitives/Icon";
import type { IconName } from "../ui/primitives/Icon";
import styles from "./catalog.module.css";
import type {
  CatalogLocale,
  CatalogSection,
  CatalogTheme,
  ChartsCatalogData,
  InfographicCatalogData,
} from "./types";

const themes: { value: CatalogTheme; icon: IconName; label: string }[] = [
  { value: "auto", icon: "monitor-cog", label: "System theme" },
  { value: "light", icon: "sun", label: "Light theme" },
  { value: "dark", icon: "moon", label: "Dark theme" },
];
const locales: CatalogLocale[] = ["es", "en"];

type CatalogShellProps = {
  title: string;
  sections: CatalogSection[];
  infographic?: InfographicCatalogData;
  charts?: ChartsCatalogData;
};

export function CatalogShell({ title, sections, infographic, charts }: CatalogShellProps) {
  const [theme, setTheme] = useState<CatalogTheme>("auto");
  const [locale, setLocale] = useState<CatalogLocale>("es");

  return (
    <div className={styles.stage} data-ds-theme={theme}>
      <header className={styles.toolbar}>
        <h1 className="ds-type-subheading-sans">{title}</h1>
        <div className={styles.group} role="group" aria-label="Theme">
          {themes.map(({ value, icon, label }) => (
            <button
              key={value}
              type="button"
              className={`${styles.toggle} ${styles.iconToggle}`}
              aria-pressed={theme === value}
              aria-label={label}
              title={label}
              onClick={() => setTheme(value)}
            >
              <Icon name={icon} size="sm" />
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
        {sections.map(({ id, title, Component }) => (
          <section key={id} id={id} className={styles.section}>
            <h2 className="ds-type-subheading-serif">{title[locale]}</h2>
            <Component locale={locale} theme={theme} infographic={infographic} charts={charts} />
          </section>
        ))}
      </main>
    </div>
  );
}
