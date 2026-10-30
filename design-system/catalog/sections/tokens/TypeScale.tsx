import type { Locale } from "./data";
import { typography } from "./data";
import styles from "./Tokens.module.css";

const heading = { es: "Tipografía", en: "Typography" };
const sample = {
  es: "¿Qué extraño músico tocaba jazz bajo la lluvia? ¡Piénsalo!",
  en: "The quick brown fox jumps over the lazy dog; how vexingly quick!",
};
export function TypeScale({ locale }: { locale: Locale }) {
  return (
    <section className={styles.section}>
      <h3 className="ds-type-title">{heading[locale]}</h3>
      <div>
        {Object.entries(typography).map(([role, token]) => {
          const family = token.$value.fontFamily.replace(/[{}]/g, "").split(".").at(-1);
          return (
            <article className={styles.typeRow} key={role}>
              <p className={`ds-type-${role} ${styles.typeSample}`}>{sample[locale]}</p>
              <p className={`ds-type-caption-medium ${styles.typeCaption}`}>
                {role} · {family} · {token.$value.fontSize} · {token.$value.fontWeight}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
