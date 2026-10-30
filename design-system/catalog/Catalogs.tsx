"use client";

import { CatalogShell } from "./CatalogShell";
import { componentSections, foundationSections } from "./registry";
import type { InfographicCatalogData } from "./types";

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
