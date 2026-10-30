import type { Metadata } from "next";
import { ComponentsCatalog } from "@ds/catalog/Catalogs";

export const metadata: Metadata = { title: "Components" };

export default function Page() {
  return <ComponentsCatalog />;
}
