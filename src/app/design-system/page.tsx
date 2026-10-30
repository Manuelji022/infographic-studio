import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { FoundationsCatalog } from "@ds/catalog/Catalogs";
import { DS_VERSION } from "@ds/infographic/manifest.ts";
import { getInfographicCss } from "@ds/infographic/render.ts";

export const metadata: Metadata = { title: "Design system" };

function readExample(locale: "es" | "en"): string {
  return readFileSync(
    path.join(process.cwd(), "design-system", "examples", `pensiones.${locale}.html`),
    "utf8",
  );
}

export default function Page() {
  const infographic = {
    css: getInfographicCss({ dsVersion: DS_VERSION, embed: true }),
    examples: { es: readExample("es"), en: readExample("en") },
  };
  return <FoundationsCatalog infographic={infographic} />;
}
