import type { Locale, TokenStyle } from "./data";
import { primitives, spacingKeys } from "./data";
import styles from "./Tokens.module.css";

const heading = { es: "Espaciado", en: "Spacing" };
export function SpacingScale({ locale }: { locale: Locale }) {
  return (
    <section className={styles.section}>
      <h3 className="ds-type-title">{heading[locale]}</h3>
      <div className={styles.section}>
        {spacingKeys.map((size) => (
          <div className={styles.measure} key={size}>
            <span className="ds-type-caption-medium">{primitives.spacing[size].$value}</span>
            <span
              className={styles.bar}
              style={{ "--bar-width": `var(--ds-spacing-${size})` } as TokenStyle}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
