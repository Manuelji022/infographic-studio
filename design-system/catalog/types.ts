import type { ComponentType } from "react";

/** Language of the sample content shown in the catalog (independent of the app locale). */
export type CatalogLocale = "es" | "en";

export type CatalogTheme = "auto" | "light" | "dark";

/** Server-built data for the infographic section (CSS and reference examples as fragments). */
export type InfographicCatalogData = {
  css: string;
  examples: Record<CatalogLocale, string>;
};

export type CatalogSectionProps = {
  locale: CatalogLocale;
  theme: CatalogTheme;
  infographic?: InfographicCatalogData;
};

export type CatalogSection = {
  id: string;
  title: Record<CatalogLocale, string>;
  Component: ComponentType<CatalogSectionProps>;
};
