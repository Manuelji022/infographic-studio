import type { Metadata } from "next";
import { CatalogShell } from "@ds/catalog/CatalogShell";

export const metadata: Metadata = { title: "Design system" };

export default function DesignSystemPage() {
  return <CatalogShell />;
}
