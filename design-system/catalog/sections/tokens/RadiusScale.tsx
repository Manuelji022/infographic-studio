import type { Locale, TokenStyle } from "./data";
import { primitives, radiusKeys } from "./data";
import styles from "./Tokens.module.css";

const heading = { es: "Radios", en: "Radius" };
export function RadiusScale({ locale }: { locale: Locale }) {
  return (
    <section className={styles.section}>
      <h3 className="ds-type-title">{heading[locale]}</h3>
      <div className={styles.grid}>
        {radiusKeys.map((radius) => (
          <article className={styles.card} key={radius}>
            <div
              className={styles.radiusItem}
              style={{ "--radius": `var(--ds-radius-${radius})` } as TokenStyle}
            >
              <span className={styles.radiusSample} />
              <p className="ds-type-caption-medium">
                {radius} · {primitives.radius[radius].$value}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
