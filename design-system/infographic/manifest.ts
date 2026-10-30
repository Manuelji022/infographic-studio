export const DS_VERSION = "1.0.0";
export const MAX_FRAGMENT_BYTES = 102400;

export type ComponentSpec = {
  name: string;
  category: "structure" | "data" | "text";
  summary: string;
  classes: readonly string[];
  variants: readonly string[];
  dataProps: readonly string[];
};

const component = (
  name: string,
  category: ComponentSpec["category"],
  summary: string,
  classes: readonly string[],
  variants: readonly string[] = [],
  dataProps: readonly string[] = [],
): ComponentSpec => ({ name, category, summary, classes, variants, dataProps });

export const COMPONENTS: readonly ComponentSpec[] = [
  component("ig-header", "structure", "Titular y entradilla", [
    "ig-header", "ig-header__title", "ig-header__lede",
  ]),
  component("ig-section", "structure", "Seccion con titulo y medida", [
    "ig-section", "ig-section__title", "ig-section__measure",
  ]),
  component("ig-card", "structure", "Tarjeta de contenido", [
    "ig-card", "ig-card__title", "ig-card__text", "ig-card--feature", "ig-card--deep",
  ], ["ig-card--feature", "ig-card--deep"]),
  component("ig-grid", "structure", "Cuadricula de contenido", ["ig-grid"]),
  component("ig-verdict", "text", "Conclusion destacada", [
    "ig-verdict", "ig-verdict__label", "ig-verdict__text",
  ]),
  component("ig-footer", "text", "Fuentes y metadatos", [
    "ig-footer", "ig-footer__sources", "ig-footer__meta",
  ]),
  component("ig-callout", "text", "Llamada destacada", [
    "ig-callout", "ig-callout__title", "ig-callout__text", "ig-callout--neutral",
  ], ["ig-callout--neutral"]),
  component("ig-options", "structure", "Lista de alternativas", [
    "ig-options", "ig-options__item", "ig-options__title", "ig-options__text",
  ]),
  component("ig-bar-chart", "data", "Grafico de barras", [
    "ig-bar-chart", "ig-bar-chart__row", "ig-bar-chart__row--projected",
    "ig-bar-chart__row--series-2", "ig-bar-chart__row--series-3",
    "ig-bar-chart__row--series-4", "ig-bar-chart__label", "ig-bar-chart__track",
    "ig-bar-chart__bar", "ig-bar-chart__value",
  ], ["ig-bar-chart__row--projected", "ig-bar-chart__row--series-2",
    "ig-bar-chart__row--series-3", "ig-bar-chart__row--series-4"], ["--ig-value", "--ig-max"]),
  component("ig-stat", "data", "Cifra destacada", [
    "ig-stat", "ig-stat__value", "ig-stat__label",
  ]),
  component("ig-change", "data", "Comparacion de valores", [
    "ig-change", "ig-change__label", "ig-change__values", "ig-change__from",
    "ig-change__arrow", "ig-change__to", "ig-change--worse",
  ], ["ig-change--worse"]),
  component("ig-timeline", "data", "Cronologia de hitos", [
    "ig-timeline", "ig-timeline__item", "ig-timeline__item--now",
    "ig-timeline__date", "ig-timeline__text",
  ], ["ig-timeline__item--now"]),
];

export const ROOT_CLASS = "ig-root";
export const ALLOWED_CLASSES: ReadonlySet<string> = new Set(
  COMPONENTS.flatMap(({ classes }) => classes),
);
export const DATA_PROPS: readonly string[] = ["--ig-value", "--ig-max"];
export const ALLOWED_TAGS: ReadonlySet<string> = new Set([
  "header", "section", "footer", "aside", "div", "h1", "h2", "h3", "p", "ul", "ol",
  "li", "span", "strong", "s", "br",
]);
export const ALLOWED_ATTRIBUTES: ReadonlySet<string> = new Set([
  "class", "style", "aria-hidden", "aria-label", "lang",
]);
export const VOID_TAGS: ReadonlySet<string> = new Set(["br"]);
export const ALLOWED_ENTITIES: ReadonlySet<string> = new Set([
  "amp", "lt", "gt", "quot", "apos", "nbsp", "rarr", "larr", "uarr", "darr",
  "times", "minus", "ndash", "mdash", "hellip", "middot", "euro", "percnt",
]);
