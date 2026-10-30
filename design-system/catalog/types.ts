import type { ComponentType } from "react";

/** Language of the sample content shown in the catalog (independent of the app locale). */
export type CatalogLocale = "es" | "en";

export type CatalogSectionProps = { locale: CatalogLocale };

export type CatalogSection = {
  id: string;
  title: Record<CatalogLocale, string>;
  Component: ComponentType<CatalogSectionProps>;
};
