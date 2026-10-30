"use client";

import { CatalogShell } from "./CatalogShell";
import { chartSections, componentSections, foundationSections } from "./registry";
import type { ChartsCatalogData, InfographicCatalogData } from "./types";

// Client wrappers: the section components are functions, so they cannot cross the server boundary.
export function FoundationsCatalog({ infographic }: { infographic: InfographicCatalogData }) {
  return (
    <CatalogShell
      title="Design system"
      sections={foundationSections}
      infographic={infographic}
    />
  );
}

export function ComponentsCatalog() {
  return <CatalogShell title="Components" sections={componentSections} />;
}

export function ChartsCatalog({ charts }: { charts: ChartsCatalogData }) {
  return <CatalogShell title="Charts" sections={chartSections} charts={charts} />;
}
