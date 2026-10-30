"use client";

import { CatalogShell } from "./CatalogShell";
import { componentSections, foundationSections } from "./registry";

// Client wrappers: the section components are functions, so they cannot cross the server boundary.
export function FoundationsCatalog() {
  return <CatalogShell title="Design system" sections={foundationSections} />;
}

export function ComponentsCatalog() {
  return <CatalogShell title="Components" sections={componentSections} />;
}
