import type { CatalogSectionProps } from "../types";
import styles from "./TokensSection.module.css";
import { PrimitiveColors } from "./tokens/PrimitiveColors";
import { SemanticColors } from "./tokens/SemanticColors";
import { TypeScale } from "./tokens/TypeScale";
import { SpacingScale } from "./tokens/SpacingScale";
import { RadiusScale } from "./tokens/RadiusScale";
import { FontFamilies } from "./tokens/FontFamilies";

export function TokensSection({ locale }: CatalogSectionProps) {
  return (
    <div className={styles.root}>
      <PrimitiveColors locale={locale} />
      <SemanticColors locale={locale} />
      <TypeScale locale={locale} />
      <SpacingScale locale={locale} />
      <RadiusScale locale={locale} />
      <FontFamilies locale={locale} />
    </div>
  );
}
