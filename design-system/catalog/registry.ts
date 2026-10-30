import { FormsSection } from "./sections/FormsSection";
import { SurfacesAndFeedbackSection } from "./sections/SurfacesAndFeedbackSection";
import { TextAndActionsSection } from "./sections/TextAndActionsSection";
import { TokensSection } from "./sections/TokensSection";
import type { CatalogSection } from "./types";

/** Ordered list of catalog sections. Owned by the coordinator; workers own their section file. */
export const catalogSections: CatalogSection[] = [
  { id: "tokens", title: { es: "Tokens", en: "Tokens" }, Component: TokensSection },
  {
    id: "text-and-actions",
    title: { es: "Texto y acciones", en: "Text and actions" },
    Component: TextAndActionsSection,
  },
  {
    id: "surfaces-and-feedback",
    title: { es: "Superficies y feedback", en: "Surfaces and feedback" },
    Component: SurfacesAndFeedbackSection,
  },
  { id: "forms", title: { es: "Formularios", en: "Forms" }, Component: FormsSection },
];
