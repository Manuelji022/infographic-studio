import type { Metadata } from "next";
import { FoundationsCatalog } from "@ds/catalog/Catalogs";

export const metadata: Metadata = { title: "Design system" };

export default function Page() {
  return <FoundationsCatalog />;
}
