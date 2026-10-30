"use client";

import { useState } from "react";
import type { CatalogSectionProps } from "../types";
import { IgFrame } from "./InfographicSection";
import styles from "./InfographicSection.module.css";

const copy = {
  es: {
    desktop: "Escritorio",
    mobile: "Móvil",
    note: "Prototipos de la Oleada 0 (spike). Se sustituirán por la librería definitiva.",
  },
  en: {
    desktop: "Desktop",
    mobile: "Mobile",
    note: "Wave 0 prototypes (spike). They will be replaced by the final library.",
  },
};

export function ChartsSection({ locale, theme, charts }: CatalogSectionProps) {
  const [mobile, setMobile] = useState(false);
  if (!charts) return null;

  const text = copy[locale];
  return (
    <div className={styles.layout}>
      <div className={styles.controls} role="group" aria-label={text.mobile}>
        <button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)}>
          {text.desktop}
        </button>
        <button type="button" aria-pressed={mobile} onClick={() => setMobile(true)}>
          {text.mobile}
        </button>
      </div>
      <p className={styles.note}>{text.note}</p>
      <div className={`${styles.preview} ${mobile ? styles.mobile : ""}`}>
        {charts.samples.map((sample) => (
          <section className={styles.item} key={sample.id}>
            <h3>
              {sample.title[locale]} <code>{sample.id}</code>
            </h3>
            <IgFrame
              fragment={sample.html[locale]}
              title={sample.title[locale]}
              locale={locale}
              theme={theme}
              css={charts.css}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
