"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "../ui/primitives/Icon";
import type { IconName } from "../ui/primitives/Icon";
import styles from "./catalog.module.css";
import type {
  CatalogLocale,
  CatalogSection,
  CatalogStyle,
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
const styleOptions: { value: CatalogStyle; label: string }[] = [
  { value: "studio", label: "Studio" },
  { value: "paper", label: "Paper" },
];

/** Mirrors a toggle into the query string without navigating or touching scroll. */
function syncParam(key: string, value: string) {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState(null, "", url);
}

type CatalogShellProps = {
  title: string;
  sections: CatalogSection[];
  infographic?: InfographicCatalogData;
  charts?: ChartsCatalogData;
};

function CatalogShellInner({ title, sections, infographic, charts }: CatalogShellProps) {
  // Style and theme live in ?style= and ?theme= (scriptable screenshots). replaceState is
  // integrated with the Next.js router, so useSearchParams re-renders after each toggle.
  const params = useSearchParams();
  const wantedTheme = params.get("theme");
  const theme: CatalogTheme =
    wantedTheme === "light" || wantedTheme === "dark" ? wantedTheme : "auto";
  const style: CatalogStyle = params.get("style") === "paper" ? "paper" : "studio";
  const [locale, setLocale] = useState<CatalogLocale>("es");

  return (
    <div className={styles.stage} data-ds-theme={theme} data-ds-style={style}>
      <header className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <h1 className="ds-type-subheading-sans">{title}</h1>
          <div className={styles.controls}>
            <div className={styles.group} role="group" aria-label="Style">
              {styleOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={styles.toggle}
                  aria-pressed={style === value}
                  onClick={() => {
                    syncParam("style", value);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className={styles.group} role="group" aria-label="Theme">
              {themes.map(({ value, icon, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.toggle} ${styles.iconToggle}`}
                  aria-pressed={theme === value}
                  aria-label={label}
                  title={label}
                  onClick={() => {
                    syncParam("theme", value);
                  }}
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
          </div>
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

/** useSearchParams opts the page into client rendering up to the nearest Suspense boundary. */
export function CatalogShell(props: CatalogShellProps) {
  return (
    <Suspense fallback={null}>
      <CatalogShellInner {...props} />
    </Suspense>
  );
}
