import type { Locale, TokenStyle } from "./data";
import { fontKeys } from "./data";
import styles from "./Tokens.module.css";

const heading = { es: "Familias tipográficas", en: "Font families" };
const sample = {
  es: "La voz editorial acompaña cada idea.",
  en: "An editorial voice carries every idea.",
};
export function FontFamilies({ locale }: { locale: Locale }) {
  return (
    <section className={styles.section}>
      <h3 className="ds-type-title">{heading[locale]}</h3>
      <div className={styles.fontGrid}>
        {fontKeys.map((font) => (
          <article className={styles.card} key={font}>
            <p className="ds-type-caption-medium">{font}</p>
            <p
              className={styles.fontSample}
              style={{ "--family": `var(--ds-font-${font})`, "--weight": 400 } as TokenStyle}
            >
              {sample[locale]} · 400
            </p>
            <p
              className={styles.fontSample}
              style={{
                "--family": `var(--ds-font-${font})`,
                "--weight": font === "sans" ? 700 : 600,
              } as TokenStyle}
            >
              {sample[locale]} · {font === "sans" ? 700 : 600}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
