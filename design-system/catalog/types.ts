import type { ComponentType } from "react";

/** Language of the sample content shown in the catalog (independent of the app locale). */
export type CatalogLocale = "es" | "en";

export type CatalogTheme = "auto" | "light" | "dark";

/** Server-built data for the infographic section (CSS and reference examples as fragments). */
export type InfographicCatalogData = {
  css: string;
  examples: Record<CatalogLocale, string>;
};

/** One chart shown at /charts: a server-rendered fragment per sample language. */
export type ChartSample = {
  id: string;
  title: Record<CatalogLocale, string>;
  html: Record<CatalogLocale, string>;
};

/** Server-built data for the charts section (CSS with the chart styles, and the samples). */
export type ChartsCatalogData = {
  css: string;
  samples: ChartSample[];
};

export type CatalogSectionProps = {
  locale: CatalogLocale;
  theme: CatalogTheme;
  infographic?: InfographicCatalogData;
  charts?: ChartsCatalogData;
};

export type CatalogSection = {
  id: string;
  title: Record<CatalogLocale, string>;
  Component: ComponentType<CatalogSectionProps>;
};
