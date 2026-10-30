import type { Locale, TokenStyle } from "./data";
import { keysOf, semantic } from "./data";
import styles from "./Tokens.module.css";

const heading = { es: "Colores semánticos", en: "Semantic colours" };
export function SemanticColors({ locale }: { locale: Locale }) {
  return (
    <section className={styles.section}>
      <h3 className="ds-type-title">{heading[locale]}</h3>
      <div className={styles.grid}>
        {keysOf(semantic).map((key) => (
          <article className={styles.card} key={key}>
            <div
              className={styles.swatch}
              style={{ "--sample": `var(--ds-${key})` } as TokenStyle}
            />
            <p className="ds-type-caption-medium">--ds-{key}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
