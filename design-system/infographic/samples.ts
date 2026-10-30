import type { DocumentLocale } from "./document.ts";

/** One catalog entry per ig-* component: a small fragment showing it and its variants. */
export type InfographicSample = {
  /** Root class of the component, e.g. "ig-card". */
  id: string;
  title: Record<DocumentLocale, string>;
  html: Record<DocumentLocale, string>;
};

const fragment = (...lines: string[]): string => lines.join("");

export const INFOGRAPHIC_SAMPLES: readonly InfographicSample[] = [
  { id: "ig-header", title: { es: "Cabecera", en: "Header" }, html: {
    es: fragment(
      "<header class=\"ig-header\">",
      "<h1 class=\"ig-header__title\">Pensiones en transición</h1>",
      "<p class=\"ig-header__lede\">Una mirada a los cambios demográficos.</p></header>",
    ),
    en: fragment(
      "<header class=\"ig-header\">",
      "<h1 class=\"ig-header__title\">Pensions in transition</h1>",
      "<p class=\"ig-header__lede\">A look at demographic change.</p></header>",
    ),
  } },
  { id: "ig-section", title: { es: "Sección", en: "Section" }, html: {
    es: fragment(
      "<section class=\"ig-section\"><h2 class=\"ig-section__title\">El gasto crece</h2>",
      "<p class=\"ig-section__measure\">Gasto anual, índice</p>",
      "<p>La tendencia exige planificación.</p></section>",
    ),
    en: fragment(
      "<section class=\"ig-section\"><h2 class=\"ig-section__title\">Spending grows</h2>",
      "<p class=\"ig-section__measure\">Annual spending, index</p>",
      "<p>The trend calls for planning.</p></section>",
    ),
  } },
  { id: "ig-card", title: { es: "Tarjetas", en: "Cards" }, html: {
    es: fragment(
      "<div class=\"ig-grid\"><div class=\"ig-card\"><h3 class=\"ig-card__title\">Base</h3>",
      "<p class=\"ig-card__text\">Escenario estable.</p></div>",
      "<div class=\"ig-card ig-card--feature\"><h3 class=\"ig-card__title\">Clave</h3>",
      "<p class=\"ig-card__text\">Prepararse pronto.</p></div>",
      "<div class=\"ig-card ig-card--deep\"><h3 class=\"ig-card__title\">A fondo</h3>",
      "<p class=\"ig-card__text\">Repartir el ajuste.</p></div></div>",
    ),
    en: fragment(
      "<div class=\"ig-grid\"><div class=\"ig-card\"><h3 class=\"ig-card__title\">Base</h3>",
      "<p class=\"ig-card__text\">Stable scenario.</p></div>",
      "<div class=\"ig-card ig-card--feature\">",
      "<h3 class=\"ig-card__title\">Key point</h3>",
      "<p class=\"ig-card__text\">Prepare early.</p></div>",
      "<div class=\"ig-card ig-card--deep\"><h3 class=\"ig-card__title\">In depth</h3>",
      "<p class=\"ig-card__text\">Share the adjustment.</p></div></div>",
    ),
  } },
  { id: "ig-grid", title: { es: "Cuadrícula", en: "Grid" }, html: {
    es: fragment(
      "<div class=\"ig-grid\"><div class=\"ig-card\">",
      "<h3 class=\"ig-card__title\">Ingresos</h3>",
      "<p class=\"ig-card__text\">Aumentar participación.</p></div>",
      "<div class=\"ig-card\"><h3 class=\"ig-card__title\">Gasto</h3>",
      "<p class=\"ig-card__text\">Revisar prestaciones.</p></div><div class=\"ig-card\">",
      "<h3 class=\"ig-card__title\">Tiempo</h3>",
      "<p class=\"ig-card__text\">Actuar gradualmente.</p></div></div>",
    ),
    en: fragment(
      "<div class=\"ig-grid\"><div class=\"ig-card\">",
      "<h3 class=\"ig-card__title\">Income</h3>",
      "<p class=\"ig-card__text\">Raise participation.</p></div><div class=\"ig-card\">",
      "<h3 class=\"ig-card__title\">Spending</h3>",
      "<p class=\"ig-card__text\">Review benefits.</p></div><div class=\"ig-card\">",
      "<h3 class=\"ig-card__title\">Time</h3>",
      "<p class=\"ig-card__text\">Act gradually.</p></div></div>",
    ),
  } },
  { id: "ig-verdict", title: { es: "Conclusión", en: "Verdict" }, html: {
    es: fragment(
      "<aside class=\"ig-verdict\"><p class=\"ig-verdict__label\">Conclusión</p>",
      "<p class=\"ig-verdict__text\">Anticipar facilita un ajuste sostenible.</p>",
      "</aside>",
    ),
    en: fragment(
      "<aside class=\"ig-verdict\"><p class=\"ig-verdict__label\">Takeaway</p>",
      "<p class=\"ig-verdict__text\">Early action makes adjustment sustainable.</p>",
      "</aside>",
    ),
  } },
  { id: "ig-footer", title: { es: "Pie", en: "Footer" }, html: {
    es: fragment(
      "<footer class=\"ig-footer\">",
      "<p class=\"ig-footer__sources\">Fuentes: datos ilustrativos.</p>",
      "<p class=\"ig-footer__meta\">Catálogo · 2025</p></footer>",
    ),
    en: fragment(
      "<footer class=\"ig-footer\">",
      "<p class=\"ig-footer__sources\">Sources: illustrative data.</p>",
      "<p class=\"ig-footer__meta\">Catalog · 2025</p></footer>",
    ),
  } },
  { id: "ig-callout", title: { es: "Avisos", en: "Callouts" }, html: {
    es: fragment(
      "<section class=\"ig-section\"><aside class=\"ig-callout\">",
      "<p class=\"ig-callout__title\">Tendencia</p>",
      "<p class=\"ig-callout__text\">El cambio será gradual.</p></aside>",
      "<aside class=\"ig-callout ig-callout--neutral\">",
      "<p class=\"ig-callout__title\">Nota</p>",
      "<p class=\"ig-callout__text\">Cifras ilustrativas.</p></aside></section>",
    ),
    en: fragment(
      "<section class=\"ig-section\"><aside class=\"ig-callout\">",
      "<p class=\"ig-callout__title\">Trend</p>",
      "<p class=\"ig-callout__text\">Change will be gradual.</p></aside>",
      "<aside class=\"ig-callout ig-callout--neutral\">",
      "<p class=\"ig-callout__title\">Note</p>",
      "<p class=\"ig-callout__text\">Illustrative figures.</p></aside></section>",
    ),
  } },
  { id: "ig-options", title: { es: "Alternativas", en: "Options" }, html: {
    es: fragment(
      "<div class=\"ig-options\"><div class=\"ig-options__item\">",
      "<h3 class=\"ig-options__title\">Ajuste gradual</h3>",
      "<p class=\"ig-options__text\">Combinar medidas en el tiempo.</p></div>",
      "<div class=\"ig-options__item\">",
      "<h3 class=\"ig-options__title\">Ajuste inmediato</h3>",
      "<p class=\"ig-options__text\">Concentrar medidas pronto.</p></div></div>",
    ),
    en: fragment(
      "<div class=\"ig-options\"><div class=\"ig-options__item\">",
      "<h3 class=\"ig-options__title\">Gradual adjustment</h3>",
      "<p class=\"ig-options__text\">Combine measures over time.</p></div>",
      "<div class=\"ig-options__item\">",
      "<h3 class=\"ig-options__title\">Immediate adjustment</h3>",
      "<p class=\"ig-options__text\">Concentrate measures early.</p></div>",
      "</div>",
    ),
  } },
  { id: "ig-bar-chart", title: { es: "Gráfico de barras", en: "Bar chart" }, html: {
    es: fragment(
      "<ul class=\"ig-bar-chart\">",
      "<li class=\"ig-bar-chart__row\" style=\"--ig-value:10;--ig-max:15\">",
      "<span class=\"ig-bar-chart__label\">Punto de partida</span>",
      "<span class=\"ig-bar-chart__track\"><span class=\"ig-bar-chart__bar\">",
      "<span class=\"ig-bar-chart__value\">10 %</span></span></span></li>",
      "<li class=\"ig-bar-chart__row ig-bar-chart__row--projected\"",
      " style=\"--ig-value:14;--ig-max:15\">",
      "<span class=\"ig-bar-chart__label\">Horizonte ilustrativo</span>",
      "<span class=\"ig-bar-chart__track\"><span class=\"ig-bar-chart__bar\">",
      "<span class=\"ig-bar-chart__value\">14 %</span></span></span></li>",
      "<li class=\"ig-bar-chart__row ig-bar-chart__row--series-2\"",
      " style=\"--ig-value:12;--ig-max:15\">",
      "<span class=\"ig-bar-chart__label\">Escenario alternativo</span>",
      "<span class=\"ig-bar-chart__track\"><span class=\"ig-bar-chart__bar\">",
      "<span class=\"ig-bar-chart__value\">12 %</span></span></span></li>",
      "<li class=\"ig-bar-chart__row ig-bar-chart__row--series-3\"",
      " style=\"--ig-value:8;--ig-max:15\">",
      "<span class=\"ig-bar-chart__label\">Escenario prudente</span>",
      "<span class=\"ig-bar-chart__track\"><span class=\"ig-bar-chart__bar\">",
      "<span class=\"ig-bar-chart__value\">8 %</span></span></span></li>",
      "<li class=\"ig-bar-chart__row ig-bar-chart__row--series-4\"",
      " style=\"--ig-value:6;--ig-max:15\">",
      "<span class=\"ig-bar-chart__label\">Escenario amplio</span>",
      "<span class=\"ig-bar-chart__track\"><span class=\"ig-bar-chart__bar\">",
      "<span class=\"ig-bar-chart__value\">6 %</span></span></span></li></ul>",
    ),
    en: fragment(
      "<ul class=\"ig-bar-chart\">",
      "<li class=\"ig-bar-chart__row\" style=\"--ig-value:10;--ig-max:15\">",
      "<span class=\"ig-bar-chart__label\">Starting point</span>",
      "<span class=\"ig-bar-chart__track\"><span class=\"ig-bar-chart__bar\">",
      "<span class=\"ig-bar-chart__value\">10 %</span></span></span></li>",
      "<li class=\"ig-bar-chart__row ig-bar-chart__row--projected\"",
      " style=\"--ig-value:14;--ig-max:15\">",
      "<span class=\"ig-bar-chart__label\">Illustrative horizon</span>",
      "<span class=\"ig-bar-chart__track\"><span class=\"ig-bar-chart__bar\">",
      "<span class=\"ig-bar-chart__value\">14 %</span></span></span></li>",
      "<li class=\"ig-bar-chart__row ig-bar-chart__row--series-2\"",
      " style=\"--ig-value:12;--ig-max:15\">",
      "<span class=\"ig-bar-chart__label\">Alternative scenario</span>",
      "<span class=\"ig-bar-chart__track\"><span class=\"ig-bar-chart__bar\">",
      "<span class=\"ig-bar-chart__value\">12 %</span></span></span></li>",
      "<li class=\"ig-bar-chart__row ig-bar-chart__row--series-3\"",
      " style=\"--ig-value:8;--ig-max:15\">",
      "<span class=\"ig-bar-chart__label\">Cautious scenario</span>",
      "<span class=\"ig-bar-chart__track\"><span class=\"ig-bar-chart__bar\">",
      "<span class=\"ig-bar-chart__value\">8 %</span></span></span></li>",
      "<li class=\"ig-bar-chart__row ig-bar-chart__row--series-4\"",
      " style=\"--ig-value:6;--ig-max:15\">",
      "<span class=\"ig-bar-chart__label\">Broad scenario</span>",
      "<span class=\"ig-bar-chart__track\"><span class=\"ig-bar-chart__bar\">",
      "<span class=\"ig-bar-chart__value\">6 %</span></span></span></li></ul>",
    ),
  } },
  { id: "ig-stat", title: { es: "Cifra", en: "Statistic" }, html: {
    es: fragment(
      "<div class=\"ig-stat\"><p class=\"ig-stat__value\">2,7x</p>",
      "<p class=\"ig-stat__label\">Aumento acumulado ilustrativo</p></div>",
    ),
    en: fragment(
      "<div class=\"ig-stat\"><p class=\"ig-stat__value\">2.7x</p>",
      "<p class=\"ig-stat__label\">Illustrative cumulative increase</p></div>",
    ),
  } },
  { id: "ig-change", title: { es: "Cambio", en: "Change" }, html: {
    es: fragment(
      "<section class=\"ig-section\"><div class=\"ig-change\">",
      "<span class=\"ig-change__label\">Dependencia</span>",
      "<span class=\"ig-change__values\"><s class=\"ig-change__from\">20 %</s>",
      "<span class=\"ig-change__arrow\" aria-hidden=\"true\">&rarr;</span>",
      "<strong class=\"ig-change__to\">35 %</strong></span></div>",
      "<div class=\"ig-change ig-change--worse\">",
      "<span class=\"ig-change__label\">Presión</span><span class=\"ig-change__values\">",
      "<s class=\"ig-change__from\">8 %</s>",
      "<span class=\"ig-change__arrow\" aria-hidden=\"true\">&rarr;</span>",
      "<strong class=\"ig-change__to\">12 %</strong></span></div></section>",
    ),
    en: fragment(
      "<section class=\"ig-section\"><div class=\"ig-change\">",
      "<span class=\"ig-change__label\">Dependency</span>",
      "<span class=\"ig-change__values\"><s class=\"ig-change__from\">20 %</s>",
      "<span class=\"ig-change__arrow\" aria-hidden=\"true\">&rarr;</span>",
      "<strong class=\"ig-change__to\">35 %</strong></span></div>",
      "<div class=\"ig-change ig-change--worse\">",
      "<span class=\"ig-change__label\">Pressure</span><span class=\"ig-change__values\">",
      "<s class=\"ig-change__from\">8 %</s>",
      "<span class=\"ig-change__arrow\" aria-hidden=\"true\">&rarr;</span>",
      "<strong class=\"ig-change__to\">12 %</strong></span></div></section>",
    ),
  } },
  { id: "ig-timeline", title: { es: "Cronología", en: "Timeline" }, html: {
    es: fragment(
      "<ol class=\"ig-timeline\"><li class=\"ig-timeline__item\">",
      "<span class=\"ig-timeline__date\">2020</span>",
      "<p class=\"ig-timeline__text\">Inicio del periodo.</p></li>",
      "<li class=\"ig-timeline__item ig-timeline__item--now\">",
      "<span class=\"ig-timeline__date\">2035</span>",
      "<p class=\"ig-timeline__text\">Horizonte de planificación.</p></li></ol>",
    ),
    en: fragment(
      "<ol class=\"ig-timeline\"><li class=\"ig-timeline__item\">",
      "<span class=\"ig-timeline__date\">2020</span>",
      "<p class=\"ig-timeline__text\">Period begins.</p></li>",
      "<li class=\"ig-timeline__item ig-timeline__item--now\">",
      "<span class=\"ig-timeline__date\">2035</span>",
      "<p class=\"ig-timeline__text\">Planning horizon.</p></li></ol>",
    ),
  } },
];
