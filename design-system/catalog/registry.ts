import { ChartsSection } from "./sections/ChartsSection";
import { ComposerSection } from "./sections/ComposerSection";
import { DialogsSection } from "./sections/DialogsSection";
import { FormsSection } from "./sections/FormsSection";
import { InfographicSection } from "./sections/InfographicSection";
import { LibrarySection } from "./sections/LibrarySection";
import { NavigationSection } from "./sections/NavigationSection";
import { ProgressAndStatesSection } from "./sections/ProgressAndStatesSection";
import { SurfacesAndFeedbackSection } from "./sections/SurfacesAndFeedbackSection";
import { TextAndActionsSection } from "./sections/TextAndActionsSection";
import { TokensSection } from "./sections/TokensSection";
import type { CatalogSection } from "./types";

/** Foundations shown at /design-system. Owned by the coordinator. */
export const foundationSections: CatalogSection[] = [
  { id: "tokens", title: { es: "Tokens", en: "Tokens" }, Component: TokensSection },
  {
    id: "infographic",
    title: { es: "Infografía", en: "Infographic" },
    Component: InfographicSection,
  },
];

/** Components shown at /components. Owned by the coordinator; workers own their section file. */
export const componentSections: CatalogSection[] = [
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
  {
    id: "composer",
    title: { es: "Compositor de prompt", en: "Prompt composer" },
    Component: ComposerSection,
  },
  {
    id: "navigation",
    title: { es: "Navegación", en: "Navigation" },
    Component: NavigationSection,
  },
  { id: "library", title: { es: "Biblioteca", en: "Library" }, Component: LibrarySection },
  { id: "dialogs", title: { es: "Diálogos", en: "Dialogs" }, Component: DialogsSection },
  {
    id: "progress-and-states",
    title: { es: "Progreso y estados", en: "Progress and states" },
    Component: ProgressAndStatesSection,
  },
];

/** Charts shown at /charts. Owned by the coordinator. */
export const chartSections: CatalogSection[] = [
  { id: "charts", title: { es: "Gráficos", en: "Charts" }, Component: ChartsSection },
];
