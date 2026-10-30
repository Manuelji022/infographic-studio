import type { Locale, TokenStyle } from "./data";
import { primitives } from "./data";
import styles from "./Tokens.module.css";

const heading = { es: "Colores primitivos", en: "Primitive colours" };
export function PrimitiveColors({ locale }: { locale: Locale }) {
  return (
    <section className={styles.section}>
      <h3 className="ds-type-title">{heading[locale]}</h3>
      <div className={styles.grid}>
        {Object.entries(primitives.color).map(([name, token]) => (
          <article className={styles.card} key={name}>
            <div
              className={styles.swatch}
              style={{ "--sample": `var(--ds-color-${name})` } as TokenStyle}
            />
            <p className="ds-type-caption-medium">{name} · {token.$value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
