# Librería de gráficos — Plan de implementación (M1b)

> Estado: **contrato v1 congelado** · 2026-10-30 (Oleada 0 cerrada)
> Documento de trabajo para iterar los pasos y delegarlos. El *qué* vive en `FUNCTIONAL_SPEC.md` §6.5 (la spec manda); este plan es el *cómo*. Mismo formato y convenciones que `DESIGN_SYSTEM_PLAN.md`.
> Convención: `[ ]` pendiente · `[~]` en curso · `[x]` hecho y revisado.

---

## 1. Objetivo y alcance

Una librería **determinista y sin dependencias de render** que convierte un **spec JSON** de gráfico en marcado estático (SVG + HTML) con los tokens del design system. El agente (M3) solo escribe specs; nunca SVG ni coordenadas.

```text
agente ──► charts: ChartSpec[]  ──► validateChartSpec()   (schema por tipo)
           html: <div class="ig-chart" data-chart="c1"></div>
                                   ──► validateFragment()    (hueco vacío, id existente)
render ──► buildDocument(html, { charts, locale, theme, … })
           └─ expandCharts(): cada hueco → renderChart(spec, { locale }) → marcado estático
```

**Dentro:** schemas, layout (escalas, ticks, treemap…), render a cadena, CSS `ig-chart__*`, hueco en manifiesto y validador, expansión en `buildDocument`, fichas, ejemplos, sección de catálogo y pruebas con artefacto.
**Fuera:** el agente y la skill (M3), la BD (`charts jsonb` se crea con el esquema de la app en M2/M3), interactividad, animación y exportación a imagen.

## 2. Decisiones

| # | Decisión | Estado | Recomendación / resultado |
| --- | --- | --- | --- |
| C1 | Spec JSON → marcado determinista | **Decidido** (spec §6.5) | El agente describe datos y textos; la librería decide escalas, posiciones y colores |
| C2 | Hueco `ig-chart` expandido al renderizar | **Decidido** | El spec se guarda junto al fragmento; el validador nunca acepta SVG del agente |
| C3 | Estáticos | **Decidido** | Sin JS, sin tooltips ni animación; valores siempre como texto |
| C4 | Treemap de un solo periodo | **Decidido** (2026-10-30) | La versión animada por años queda fuera; comparar años, si hace falta, con pequeños múltiplos (ver §10) |
| C5 | Validación de specs | **Decidido** (2026-10-30) | **Añadir `zod`** como dependencia: la spec ya la prevé para `save_infographic` (§5.5) y en M3 hará falta igualmente. Alternativa: validador propio como el de `validate.ts` (más código que mantener). Requiere aprobación (nueva dependencia) |
| C6 | Técnica de render | **Confirmado** por la spike 0.3 | **Geometría en SVG, textos en HTML.** Marcas en un `<svg viewBox="0 0 100 100" preserveAspectRatio="none">` con `vector-effect: non-scaling-stroke`; etiquetas y valores en HTML posicionado en % encima. Así el texto no encoge con el ancho, respeta los roles tipográficos y hace saltos de línea solo. Donut y pictograma con proporción fija |
| C7 | Medida de texto (¿cabe la etiqueta?) | **Confirmado** (la spike usó una estimación por caracteres; la tabla de glifos llega en 1.D). **Solo sans (Geist):** Source Serif 4 tiene eje `opsz` y sus avances cambian con el tamaño (error del 14 % medido en 1.D); los gráficos no usan serif | Tabla de anchos de glifo de Geist y Source Serif 4 generada **una vez** con Chrome headless (`scripts/dev/glyph-widths.mjs`) y versionada como JSON. `measure.ts` estima el ancho sin DOM, con un margen de seguridad del 10 % |
| C8 | Responsive | **Confirmado** por la spike 0.3 | La geometría ya es fluida (C6). La densidad de etiquetas se decide para dos anchos (estrecho ≤ 480 px y ancho); el render emite ambas variantes de etiquetas y una *container query* muestra la que toca. Sin JS |
| C9 | Marcado del hueco | **Decidido** (contrato v1) | `<div class="ig-chart" data-chart="c1"></div>`: vacío, `data-chart` permitido **solo** en `ig-chart`, id `^[a-z][a-z0-9-]{0,31}$`. Las clases `ig-chart__*` que genera el render **no** se admiten en el fragmento del agente |
| C10 | Trazabilidad de valores | **Decidido** (contrato v1) | Cada serie (o el gráfico entero, si es una sola fuente) lleva `sourceQuote`. No se duplican los valores en `keyData`; `keyData` queda para las cifras de texto (`ig-stat`, `ig-change`…). La comprobación de que la cita está en el texto original llega con `save_infographic` (M3) |
| C11 | Amarillos del propietario | **Decidido** (2026-10-30) | Ver §5.3: rol **"destacado"** para áreas grandes (treemap, donut, columnas), con texto `slate-dark` encima. **No** sirven para líneas, puntos ni marcas finas en el tema claro (≤ 1,43:1 sobre `surface`) |
| C12 | Rojo como dato | **Decidido** (2026-10-30) | `red` es hoy la señal de error. Se permite como color de datos **solo** con `emphasis: "negative"` explícito en el spec (p. ej. "Intereses de la deuda"), nunca como color de serie por defecto |

## 3. Principios (reglas duras para workers y revisión)

Se aplican todas las reglas de `DESIGN_SYSTEM_PLAN.md` §3. Además:

1. **Funciones puras.** `renderChart(spec, options)` devuelve una cadena; sin `node:*`, sin DOM, sin `Date.now()` ni aleatoriedad. El mismo spec produce siempre el mismo marcado byte a byte (lo usa el catálogo en el cliente y el servidor al exportar).
2. **Todo texto del spec se escapa.** Ninguna cadena del spec llega al marcado sin pasar por el escape. Ningún valor del spec se interpola en CSS ni en atributos sin validar.
3. **Números finitos o error.** `NaN`, `Infinity`, valores negativos donde no caben (donut, treemap, pictograma) o series vacías se rechazan en el schema, no se "arreglan" en el render.
4. **Valores siempre visibles como texto**, formateados con `Intl.NumberFormat` según `locale` (I18N-07). Ningún dato se comunica solo por color.
5. **Colores solo por token** (`var(--ds-data-*)`, `var(--ds-chart-*)`); el render nunca emite un hex.
6. **Accesibilidad:** `role="img"` y `aria-labelledby` (título + descripción) en el contenedor, y una `<table>` con los datos dentro de un `VisuallyHidden` equivalente (`ig-chart__table`).
7. **Sin dependencias de gráficos** (ni d3, ni similares). La matemática (escalas, ticks "bonitos", squarify) es propia y pequeña.

## 4. Arquitectura de carpetas

```text
design-system/charts/
├── schema/
│   ├── common.ts          # ChartSpec base, Series, Category, textos, formato de números
│   ├── line.ts · column.ts · stacked.ts · donut.ts · pictogram.ts · scatter.ts · ranking.ts · treemap.ts
│   └── index.ts           # unión discriminada por `type` + validateChartSpec()
├── layout/
│   ├── scale.ts           # escalas lineales, dominio, ticks "bonitos"
│   ├── measure.ts         # ancho estimado de texto (tabla de glifos)
│   ├── glyph-widths.ts    # GENERADO por scripts/dev/glyph-widths.mjs
│   └── treemap.ts         # squarify con grupos
├── render/
│   ├── shared.ts          # escape, contenedor, título/desc, tabla accesible, leyenda
│   ├── line.ts · column.ts · stacked.ts · donut.ts · pictogram.ts · scatter.ts · ranking.ts · treemap.ts
│   └── index.ts           # renderChart(spec, { locale }) → string
├── format.ts              # Intl por locale: número, %, moneda, compacto
├── css/charts.css         # clases ig-chart__* (importado desde infographic/components.css)
├── fixtures/
│   ├── valid/*.json       # un spec por tipo y variante (ES y EN)
│   └── invalid/*.json     # specs que deben fallar, con el código esperado
└── index.ts               # API pública: validateChartSpec, renderChart, expandCharts, tipos
scripts/dev/
├── glyph-widths.mjs       # genera layout/glyph-widths.json con Chrome headless
├── charts-*-test.ts       # uno por tarea de la Oleada 1 (schema, scale, measure); se unifican en 3.A
└── charts-report.ts       # escribe design-system/reports/charts/<tipo>.html (artefacto)
```

Integración con lo existente: `infographic/manifest.ts` (hueco), `infographic/validate.ts` (atributo `data-chart` y reglas del hueco), `infographic/render.ts` y `document.ts` (opción `charts`), `catalog/registry.ts` (sección "Gráficos", solo el coordinador) y `tokens/` (roles de §5.3).

## 5. Contrato (congelado como v1 el 2026-10-30)

### 5.1 Campos comunes

```ts
type ChartSpecBase = {
  id: string;                 // ^[a-z][a-z0-9-]{0,31}$, único en la infografía
  type: ChartType;            // "line" | "column" | "stacked" | "donut" | "pictogram" | "scatter" | "ranking" | "treemap"
  title: string;              // ≤ 120 caracteres; también es el <title> accesible
  description?: string;       // ≤ 280; qué se mide y en qué unidad (la línea "measure" de ig-section)
  unit?: UnitFormat;          // { kind: "number" | "percent" | "currency", currency?: "EUR" | "USD", decimals?: 0–2, suffix?: string }
  sourceQuote: string;        // C10; o una por serie en los tipos con series
  note?: string;              // pie corto ("Previsión a partir de 2025")
};
```

Límites comunes: ≤ 6 series con color propio (spec §6.5: más categorías → grupos u "Otros"), ≤ 60 puntos por serie, etiquetas ≤ 40 caracteres.

### 5.2 Por tipo

| Tipo | Campos propios | Reglas de validación |
| --- | --- | --- |
| `line` | `x: { kind: "year" \| "category", values: (number \| string)[] }`, `series: { name, values: (number \| null)[], projectedFrom?: index }[]` (1–4) | Todas las series con la misma longitud que `x`; `null` = hueco; `projectedFrom` dentro de rango |
| `column` | `categories: string[]`, `series: { name, values: number[] }[]` (1–4, agrupadas) | Longitudes iguales; ≤ 12 categorías |
| `stacked` | `layout: "columns" \| "bar"`, `mode: "absolute" \| "percent"`, `categories`, `series` (2–6) | Valores ≥ 0; en `bar` una sola categoría |
| `donut` | `parts: { label, value, emphasis? }[]` (2–6), `total?: { label, value }` | Valores > 0 |
| `pictogram` | `of: 10 \| 100`, `value: number`, `label`, `icon: "person" \| "square" \| "circle"` | `0 ≤ value ≤ of`; admite un decimal en `of: 10` |
| `scatter` | `x: { label, unit? }`, `y: { label, unit? }`, `points: { label?, x, y, highlight? }[]` (≤ 60) | Etiquetas solo en puntos `highlight` (≤ 8) |
| `ranking` | `items: { label, value, emphasis? }[]` (≤ 15), `order: "desc" \| "asc"` | El render ordena; el agente no tiene que hacerlo |
| `treemap` | `items: { label, value, group?, emphasis? }[]` (≤ 30), `groups?: { id, label, tone }[]`, `period?: string` (p. ej. "1996") | Valores > 0; `group` existe en `groups`; `tone` ∈ §5.3 |

`emphasis`: `"highlight"` (amarillo, §5.3), `"negative"` (rojo, C12) o ausente.

`tone` (grupos de treemap): `"data-1"`…`"data-6"`, `"highlight"` (el item con `emphasis: "highlight"` usa `highlight`; sus hermanos, `highlight-soft`), `"negative"` o `"neutral"` (`--ds-surface-deep` con `--ds-text`, clase `ig-chart__neutral`). Decidido durante 1.A.

### 5.3 Tokens nuevos (capa semántica, en ambos temas)

Los amarillos son ya primitivos (`yellow`, `yellow-light`, `yellow-pale`, `yellow-muted`). Contraste medido por el coordinador (el informe de 1.C lo re-verifica):

| Primitivo | Sobre `surface` claro | Sobre `surface` oscuro | `slate-dark` encima |
| --- | --- | --- | --- |
| `yellow` `#FFCD00` | 1,43:1 | 10,99:1 | 12,28:1 |
| `yellow-light` `#FFDA48` | 1,30:1 | 12,09:1 | 13,50:1 |
| `yellow-pale` `#FFE586` | 1,19:1 | 13,21:1 | 14,75:1 |
| `yellow-muted` `#EDE0B0` | 1,25:1 | 12,49:1 | 13,95:1 |

Consecuencia: en el tema claro ningún amarillo distingue una marca de su fondo (WCAG 1.4.11 pide 3:1). Propuesta:

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--ds-chart-highlight` | `yellow` | `yellow` | Área destacada (treemap, donut, columna) |
| `--ds-chart-highlight-soft` | `yellow-pale` | `yellow-muted` | Hermanas del mismo grupo destacado |
| `--ds-chart-on-highlight` | `slate-dark` | `slate-dark` | Texto sobre amarillo (≥ 12:1) |
| `--ds-chart-negative` | `red` | `red` | `emphasis: "negative"` (C12) |
| `--ds-chart-gap` | `surface` | `surface` | Separación de 2 px entre celdas o sectores |
| `--ds-chart-grid` | `border` | `border` | Rejilla y ejes |
| `--ds-on-data-1…6` | 1 `slate-dark` (4,55) · 2 `ivory-light` (17,5) · 3 `slate-dark` (4,55) · 4 `ivory-light` (4,86) · 5 `ivory-light` (4,66) · 6 `slate-dark` (ver nota) | todos `slate-dark` (≥ 5,90) | Etiquetas dentro de marcas (treemap, columnas apiladas). Valores fijados por el coordinador; `check-contrast` los verifica |
| `--ds-chart-on-negative` | `ivory-light` (4,55) | `ivory-light` (4,55) | Texto sobre `--ds-chart-negative` |

**Nota `data-6`:** en el tema claro ningún texto llega a 4,5:1 sobre `sage` (`slate-dark` 4,44, `ivory-light` 3,94). Regla: el render **nunca** pone texto sobre una marca `data-6`; su etiqueta va fuera o sobre pastilla `--ds-surface`. `check-contrast` registra el par `on-data-6`/`data-6` claro como excepción documentada, no como aprobado.

Regla de uso: en el tema claro las áreas amarillas siempre llevan **borde de 1 px `--ds-border-strong`** o la separación `--ds-chart-gap` y una **etiqueta de texto**, de modo que la marca no dependa del contraste de relleno. Prohibido usar amarillo en líneas, puntos o barras de menos de 8 px.

### 5.4 Vocabulario CSS (lo crea 1.C; lo usan los renders de la Oleada 2)

Todas las clases que emite el render llevan prefijo `ig-chart`. El agente **no** puede escribirlas (C9): solo existen en la salida de `renderChart`.

| Clase | Qué es |
| --- | --- |
| `ig-chart` | Contenedor (`container-type: inline-size`, fuente sans, color `--ds-text`) |
| `ig-chart__title` · `ig-chart__desc` · `ig-chart__note` | Título, descripción (qué se mide) y nota al pie |
| `ig-chart__plot` | Área de trazado (`position: relative`); alto por modificador `--h-sm/md/lg` (240/320/400 px) o `aspect-ratio` en línea |
| `ig-chart__svg` | SVG de geometría (`position: absolute; inset: 0`, `non-scaling-stroke` en sus hijos) |
| `ig-chart__grid` · `ig-chart__axis` · `ig-chart__tick` | Rejilla, eje y etiqueta de tick |
| `ig-chart__label` · `ig-chart__value` | Etiqueta y valor posicionados en % (HTML) |
| `ig-chart__s1…s6` | Serie/categoría: fija `--chart-color: var(--ds-data-N)` y `--chart-on: var(--ds-on-data-N)` |
| `ig-chart__highlight` · `ig-chart__highlight-soft` · `ig-chart__negative` · `ig-chart__neutral` | Énfasis y tono neutro (§5.3), mismas dos variables |
| `ig-chart__cell` | Celda HTML posicionada (treemap, apiladas) con `background: var(--chart-color)` y `color: var(--chart-on)` |
| `ig-chart__legend` · `ig-chart__legend-item` · `ig-chart__swatch` | Leyenda |
| `ig-chart__also` | Lista anexa «También: …» |
| `ig-chart__wide` · `ig-chart__narrow` | Variantes por ancho: `@container (max-width: 480px)` oculta `__wide` y muestra `__narrow` (con `display: revert`). Ponerlas solo en **envoltorios** `div`/`span` sin `display` propio: si un elemento flex lleva `__narrow`, `revert` lo devuelve a `block` |
| `ig-chart__table` | Tabla accesible oculta (`display: block`, 1 px, `clip-path`) |

### 5.5 API

```ts
validateChartSpec(input: unknown): { ok: true; spec: ChartSpec } | { ok: false; issues: ChartIssue[] };
renderChart(spec: ChartSpec, options: { locale: "es" | "en" }): string;           // pura, sin node:*
expandCharts(fragment: string, charts: ChartSpec[], options): string;            // sustituye huecos
buildDocument(fragment, { …, charts?: ChartSpec[] });                             // llama a expandCharts
```

`ChartIssue` sigue la forma de `ValidationIssue` (`code`, `message`, `path`), para que el agente reciba los errores de specs y de HTML con el mismo formato.

## 6. Modos de fallo (antes de escribir código)

`AGENTS.md` pide enumerar los fallos de todo lo que se pruebe aislado. Cada uno tiene un fixture o una comprobación en `charts-test.ts`:

- **Schema:** tipo desconocido; campo de más; longitudes de series distintas de `x`; números no finitos; negativos en donut/treemap/pictograma; `value > of` en pictograma; más de 6 series coloreadas; ids duplicados; id con caracteres no permitidos; textos vacíos o demasiado largos; `group` inexistente; `projectedFrom` fuera de rango.
- **Escala y ticks:** todos los valores iguales (dominio de ancho 0); un solo punto; todos cero; valores negativos y positivos mezclados (eje en 0); magnitudes muy grandes (1e9) y muy pequeñas (0,003); ticks que no son "bonitos" o que se solapan.
- **Treemap:** un solo item; un item que es el 99 %; muchos items diminutos (< 0,5 %); grupos con un solo item; suma que no es 100 (se normaliza, no se exige); celdas con relación de aspecto extrema; etiqueta que no cabe (debe ir fuera o a la lista anexa, nunca cortada).
- **Texto:** etiquetas largas en español a 360 px; caracteres que necesitan escape (`<`, `&`, `"`); bidi y control (mismo criterio que `validate.ts`); formato de número por locale (`27,4 %` frente a `27.4%`).
- **Hueco:** hueco con id inexistente; spec que no se usa; hueco con contenido; `data-chart` fuera de `ig-chart`; clases `ig-chart__*` escritas por el agente; el mismo spec usado dos veces (se permite).
- **Render:** salida no determinista; color literal en la salida; marcado que el CSP del iframe bloquea; tabla accesible ausente; valores que solo se distinguen por color; desbordamiento horizontal a 360 px.

## 7. Plan por oleadas

Ejecutan workers `pi` (gpt-6-luna) según la memoria de flujo del propietario; el coordinador revisa cada entrega con capturas propias (`DESIGN_SYSTEM_PLAN.md` §8). Tareas de 2–3 ficheros de lógica como máximo. Si un worker falla dos veces en layout (escalas, treemap), la tarea pasa a Codex `gpt-6.1-sol` (`AGENTS.md`).

### Oleada 0 — Contrato y spike (coordinador, sin workers)

- [x] **0.1** El propietario aprueba C5 (zod), C11 (amarillos) y C12 (rojo) el 2026-10-30. C6–C10 se confirman con la spike 0.3.
- [x] **0.2** §5 congelado como **v1** con las lecciones de la spike (abajo).
- [x] **0.3** Spike: `line` y `treemap` mínimos con la técnica C6/C8, renderizados en una página temporal a 360 y 1280 px en ambos temas. Sale con una decisión: C6 se confirma o se cambia antes de lanzar workers.
- [x] **0.4** Esqueleto de `design-system/charts/` (§4) con `index.ts` vacío y `charts.css` importado desde `infographic/components.css`.

### Lecciones de la spike (Oleada 0)

- **C6/C8 funcionan.** Líneas: SVG con `preserveAspectRatio="none"` y `non-scaling-stroke` + texto HTML en %; treemap: solo celdas HTML posicionadas en %, sin SVG. La container query cambia de variante sin JS.
- **Líneas en estrecho:** reservar margen derecho para las etiquetas finales se come ~40 % del ancho a 360 px. En la variante estrecha, la etiqueta final va **encima del último punto** (o en leyenda si hay > 2 series), no a la derecha. Las etiquetas del primer punto no deben tapar otras líneas: colocarlas en el lado libre o sobre pastilla `--ds-surface`.
- **Treemap:** nunca mostrar el valor sin el nombre (ambiguo): o nombre + valor, o la celda va vacía y el item a la lista «También». Cada grupo necesita un relleno distinto (en la spike «Estado» y «Otros» coincidían). El color del texto por relleno y tema sale de `--ds-on-data-*`, no de un cálculo en el render.
- **Rojo:** `red` con texto `ivory-light` da 4,55:1, justo en el límite. Para `emphasis: "negative"` el texto encima es `--ds-on-data` del rojo, verificado por `check-contrast`.
- **Workers:** `pi`/luna no fue capaz con layout y geometría (2 fallos); Codex `gpt-6.1-sol` resolvió ambos al primer intento. Las tareas de layout y render (1.B, 1.D, Oleada 2) van a `gpt-6.1-sol`; `pi` para esquema, fixtures, fichas y tareas mecánicas.
- **Ruta `/charts`** (coordinador, 2026-10-30): catálogo privado de gráficos con tema, idioma y vista móvil, en iframe con el CSP real. Hoy muestra la spike; en 3.B pasa a mostrar los fixtures de la librería (sustituye a la sección "Gráficos" prevista en `/design-system`).
- **Tabla accesible:** una `<table>` ignora `width/height: 1px` y crece hasta su contenido (añadía ~500 px de alto invisible). El patrón oculto de `ig-chart__table` lleva `display: block`.
- **Tema `auto`:** toda regla de color por tema debe repetirse bajo `@media (prefers-color-scheme: dark) { [data-ds-theme="auto"] … }`, como `themes.css`. Con `--ds-on-data-*` (tokens) el problema desaparece.
- **Eje X en móvil:** dentro del catálogo el gráfico mide ~290 px y los años alternos aún se solapan. La variante estrecha calcula cuántas etiquetas caben con `measure.ts`, no "una de cada dos".
- **Caché de CSS:** `getInfographicCss` cacheaba los tokens para toda la vida del proceso y el servidor de desarrollo no veía los amarillos nuevos. Corregido: en desarrollo se relee siempre.
- Los ficheros de `design-system/charts/spike/` y `scripts/dev/spike-*.ts` son desechables: se borran cuando 2.A y 2.E estén aceptadas.

### Oleada 1 — Base

| Tarea | Target | Entregable | Aceptación |
| --- | --- | --- | --- |
| **1.A** Schemas | `charts/schema/**` | Schema común + 8 tipos, `validateChartSpec`, fixtures `valid/` e `invalid/` | `charts-test.ts`: todos los válidos pasan, cada inválido falla con su `code` |
| **1.B** Escalas y formato | `charts/layout/scale.ts`, `charts/format.ts` | Escala lineal, dominio con 0, ticks bonitos; `Intl` por locale | Casos de §6 "Escala y ticks" y formato ES/EN en `charts-test.ts` |
| **1.C** Tokens y CSS base | `tokens/semantic.tokens.json`, `themes/*.tokens.json`, `charts/css/charts.css`, `scripts/check-contrast.mjs` (pares nuevos) | Tokens de §5.3, contenedor, título, leyenda, ejes, tabla accesible | `tokens:check` y `contrast:check` limpios con los pares nuevos en el informe |
| **1.D** Medida de texto | `scripts/dev/glyph-widths.mjs`, `charts/layout/measure.ts`, `glyph-widths.ts` | Tabla generada y estimador | Error ≤ 10 % frente a la medida real de Chrome en 50 cadenas ES/EN |
| **1.E** Hueco | `infographic/manifest.ts`, `infographic/validate.ts`, fixtures del validador | `ig-chart` y `data-chart` según C9 | Los 59 fixtures actuales siguen pasando + fixtures nuevos de §6 "Hueco" |

1.A–1.E en paralelo (ficheros disjuntos). 1.C es la única que toca tokens.

### Lecciones de la Oleada 1

- **Pruebas tautológicas:** una prueba que mide con el mismo método con que se generó el dato no demuestra nada (1.D comparaba canvas sin kerning con una tabla sin kerning). Exigir siempre una referencia independiente del objeto real (aquí, el HTML que pinta el navegador).
- Los workers se detienen correctamente ante un typecheck roto por otro worker; en una oleada paralela, avisar desde el principio de que el `tsc` global puede fallar por ficheros ajenos y que comprueben los suyos con `grep -v`.
- Codex `gpt-6.1-sol` preguntó con `ask` en vez de inventar en tres ocasiones (formato de %, `maxTicks`, extremos IEEE): las preguntas fueron buenas y evitaron cambios de contrato silenciosos.
- `pi` sigue entregando CSS con fallos sutiles (`display: initial`, reglas de tema globales). Para la Oleada 2, render y CSS van a Codex; `pi` solo para fichas `.md`.

### Oleada 2 — Tipos de gráfico

| Tarea | Tipos | Notas |
| --- | --- | --- |
| **2.A** | `line` | Tramo proyectado discontinuo; etiqueta directa al final de cada serie; huecos con `null` |
| **2.B** | `column`, `stacked` | Valor encima de cada columna; en apiladas, valor dentro si cabe (1.D) y si no, en la leyenda |
| **2.C** | `donut`, `pictogram` | Sectores con `--ds-chart-gap`; total en el centro; pictograma en rejilla CSS |
| **2.D** | `scatter`, `ranking` | Etiquetas solo en `highlight`; ranking ordenado por el render |
| **2.E** | `treemap` | Squarify con grupos (`layout/treemap.ts`) + render. Etiquetas que no caben: fuera de la celda o en lista anexa. Candidata a `gpt-6.1-sol` |

Cada tarea entrega `render/<tipo>.ts`, sus fixtures, su ficha `design-system/components/ig-chart-<tipo>.md` y su página en `charts-report.ts`. Dependen de la Oleada 1 completa.

### Oleada 3 — Integración, catálogo y ejemplos

| Tarea | Entregable |
| --- | --- |
| **3.A** `expandCharts` + `buildDocument` | Opción `charts` en `render.ts` y `document.ts`; huecos expandidos en iframe y en export autocontenido; `render-test.ts` ampliado |
| **3.B** Catálogo | Sección "Gráficos" en `/design-system`: cada tipo y variante en claro/oscuro y ES/EN, dentro del iframe con el CSP real. El registro lo edita el coordinador |
| **3.C** Ejemplos | `examples/gasto-publico.es/en.html` + specs: treemap del gasto por función (1996, datos de la imagen de referencia, marcados como ilustrativos) y `pensiones.*` con una serie temporal en `line` |

Salida de la oleada: **capturas del catálogo y de los ejemplos** a 360 y 1280 px en ambos temas, revisadas por el coordinador y **aprobadas por el propietario**.

### Aceptación común

`pnpm lint`, `pnpm next typegen && pnpm tsc --noEmit`, `pnpm tokens:check`, `pnpm contrast:check`, `node scripts/dev/charts-test.ts` (salida pegada), greps de §3 (sin hex en `charts/render/**`, sin `box-shadow`, sin `gradient`, sin `!important`), líneas ≤ 100 y capturas propias. Artefacto repetible: `design-system/reports/charts/*.html`, regenerable con `charts-report.ts` y comparable por diff.

## 8. Plantilla de `SPEC` para workers

La de `DESIGN_SYSTEM_PLAN.md` §7, añadiendo a "Lee antes": `CHART_LIBRARY_PLAN.md` §3, §5 y §6 (con rangos `sed -n`) y la ficha del tipo.

## 9. Seguimiento

| Tarea | Estado | Worker | Revisión | Notas |
| --- | --- | --- | --- | --- |
| 0.1 Decisiones | [x] | propietario | — | C5, C11, C12 aprobadas |
| 0.2 Congelar contrato | [x] | coordinador | — | v1 con `--ds-on-data-*` y reglas de etiquetas de la spike |
| 0.3a Spike `line` | [x] | pi (falló: no dibujaba líneas) → Codex gpt-6.1-sol | Aceptada | C6/C8 válidos. Capturas en `design-system/reports/charts-spike/line/` |
| 0.3b Spike `treemap` | [x] | pi (1.º bien, corrección fallida) → Codex gpt-6.1-sol | Aceptada | Squarify con grupos, contraste por grupo y tema (mín. 4,55:1), lista «También». Capturas en `design-system/reports/charts-spike/treemap/` |
| 0.4 Esqueleto + `zod` | [x] | pi | Aceptada | `zod` 4.6.7; esqueleto sin lógica |
| 1.A Schemas | [x] | Codex gpt-6-luna (max) | Aceptada | 8 schemas zod estrictos, `ChartTone` (decidido durante la tarea), límite \|v\| ≤ 1e15. 22 válidos + 19 inválidos; probado además con entradas adversariales (`__proto__`, NaN en texto, null, bidi) |
| 1.B Escalas y formato | [x] | Codex gpt-6.1-sol | Aceptada | 45/45. El 0 y la cobertura mandan sobre `maxTicks`; ES usa U+00A0 antes de % (Intl) y U+202F antes del sufijo |
| 1.C Tokens y CSS base | [x] | pi | Aceptada con correcciones | Tokens y pares de contraste con excepción `data-6` claro. Corregido por el coordinador: `display: initial` volvía inline los div, el borde del amarillo borraba el separador en tema `auto` oscuro (ahora `outline` con `--chart-edge`), línea > 100 |
| 1.D Medida de texto | [x] | Codex gpt-6.1-sol (4 envíos) | Aceptada con correcciones | Solo Geist (serif descartada por `opsz`). `‰` sin cobertura. La primera prueba era tautológica (canvas sin kerning contra tabla sin kerning); ahora compara con HTML real: subestima ≤ 0,53 %, sobreestima ≤ 5,7 % (kerning), margen con SAFETY ≥ 9,4 % |
| 1.E Hueco | [x] | Codex gpt-6.1-sol | Aceptada con correcciones | Forma canónica exacta o `chart-hole-invalid`; `chartReferences()`. 96/96 fixtures (34 nuevos). Corregido por el coordinador: `manifest-check.ts` no leía `charts.css` |
| 2.A `line` | [ ] | | | |
| 2.B `column`, `stacked` | [ ] | | | |
| 2.C `donut`, `pictogram` | [ ] | | | |
| 2.D `scatter`, `ranking` | [ ] | | | |
| 2.E `treemap` | [ ] | | | |
| 3.A Integración | [ ] | | | |
| 3.B Catálogo | [ ] | | | |
| 3.C Ejemplos | [ ] | | | |

## 10. Riesgos abiertos

- **Etiquetas en 360 px:** el español alarga las etiquetas; el treemap y las columnas agrupadas son los más expuestos. Mitigación: C7/C8 y la spike 0.3.
- **Estimación de anchos (C7):** si la fuente no carga (export sin base64, fuentes de respaldo), las medidas se desvían. Mitigación: margen del 10 % y fallback a etiqueta fuera.
- **Amarillos en tema claro (C11):** contraste de relleno ≤ 1,43:1; depende de bordes y etiquetas. Revisar con capturas reales.
- **Paleta con amarillo + rojo + cálidos:** riesgo de gráficos demasiado cargados. Regla: como máximo un `highlight` y un `negative` por gráfico.
- **Treemap con varios periodos:** fuera por C4. Si aparece la necesidad, pequeños múltiplos de 2–3 periodos con la misma escala.
- **Tamaño del fragmento:** la expansión ocurre al renderizar, así que no cuenta para los 100 KB del agente, pero sí para el iframe y el export. Medir en 3.A.
