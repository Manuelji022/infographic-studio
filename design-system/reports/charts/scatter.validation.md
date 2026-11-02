# Verificación de revisión 2.D-fix
Se retiró la lista completa de scatter: solo se etiquetan los destacados y la lista de respaldo
contiene exclusivamente sus nombres y coordenadas. Los demás datos siguen en la tabla accesible.
La colocación prueba cuatro lados y rechaza cajas que intersecten cualquier punto u otra etiqueta;
si no encuentra sitio, usa números con líneas guía y una lista de destacados.
El título X queda junto a los ticks y los valores de ranking siguen el extremo de sus barras.

Los avisos MODULE_TYPELESS_PACKAGE_JSON se omiten mediante NODE_NO_WARNINGS=1.
Los informes HTML, los JSON de layout y scatter.review.layout.json son artefactos repetibles.

```sh
pnpm next typegen && pnpm tsc --noEmit
```
```text
Generating route types...
✓ Types generated successfully
Exit: 0
```

```sh
pnpm lint
```
```text
$ eslint
Exit: 0
```

```sh
node scripts/dev/charts-schema-test.ts
```
```text
OK valid/column.en.json
OK valid/column.es.json
OK valid/column.four-series.en.json
OK valid/column.four-series.es.json
OK valid/column.many.en.json
OK valid/column.many.es.json
OK valid/column.negative.en.json
OK valid/column.negative.es.json
OK valid/donut.en.json
OK valid/donut.es.json
OK valid/donut.no-total.en.json
OK valid/donut.no-total.es.json
OK valid/donut.six-parts.en.json
OK valid/donut.six-parts.es.json
OK valid/donut.tiny-part.en.json
OK valid/donut.tiny-part.es.json
OK valid/line.dense.en.json
OK valid/line.dense.es.json
OK valid/line.en.json
OK valid/line.es.json
OK valid/line.gaps.en.json
OK valid/line.gaps.es.json
OK valid/line.negative.en.json
OK valid/line.negative.es.json
OK valid/line.projected.en.json
OK valid/line.projected.es.json
OK valid/line.single-point.en.json
OK valid/line.single-point.es.json
OK valid/pictogram.decimal.en.json
OK valid/pictogram.decimal.es.json
OK valid/pictogram.en.json
OK valid/pictogram.es.json
OK valid/pictogram.full.en.json
OK valid/pictogram.full.es.json
OK valid/pictogram.hundred.en.json
OK valid/pictogram.hundred.es.json
OK valid/pictogram.zero.en.json
OK valid/pictogram.zero.es.json
OK valid/ranking.asc.en.json
OK valid/ranking.asc.es.json
OK valid/ranking.en.json
OK valid/ranking.es.json
OK valid/ranking.fifteen.en.json
OK valid/ranking.fifteen.es.json
OK valid/ranking.negative.en.json
OK valid/ranking.negative.es.json
OK valid/scatter.dense.en.json
OK valid/scatter.dense.es.json
OK valid/scatter.en.json
OK valid/scatter.es.json
OK valid/scatter.negative.en.json
OK valid/scatter.negative.es.json
OK valid/scatter.no-highlight.en.json
OK valid/scatter.no-highlight.es.json
OK valid/stacked.bar.absolute.en.json
OK valid/stacked.bar.absolute.es.json
OK valid/stacked.bar.percent.en.json
OK valid/stacked.bar.percent.es.json
OK valid/stacked.bar.tiny.en.json
OK valid/stacked.bar.tiny.es.json
OK valid/stacked.columns.absolute.en.json
OK valid/stacked.columns.absolute.es.json
OK valid/stacked.columns.highlight-free.en.json
OK valid/stacked.columns.highlight-free.es.json
OK valid/stacked.columns.percent.en.json
OK valid/stacked.columns.percent.es.json
OK valid/stacked.columns.six-series.en.json
OK valid/stacked.columns.six-series.es.json
OK valid/treemap.data6.en.json
OK valid/treemap.data6.es.json
OK valid/treemap.dominant.en.json
OK valid/treemap.dominant.es.json
OK valid/treemap.en.json
OK valid/treemap.es.json
OK valid/treemap.item-highlight.en.json
OK valid/treemap.item-highlight.es.json
OK valid/treemap.no-groups.en.json
OK valid/treemap.no-groups.es.json
OK valid/treemap.single.en.json
OK valid/treemap.single.es.json
OK valid/treemap.tiny.en.json
OK valid/treemap.tiny.es.json
OK invalid/control-character.json
OK invalid/donut-negative-value.json
OK invalid/duplicate-group-id.json
OK invalid/empty-title.json
OK invalid/invalid-id.json
OK invalid/line-length-mismatch.json
OK invalid/long-title.json
OK invalid/missing-group.json
OK invalid/not-finite.json
OK invalid/pictogram-negative-value.json
OK invalid/pictogram-over-of.json
OK invalid/pictogram-too-many-decimals.json
OK invalid/projected-from-out-of-range.json
OK invalid/too-large-number.json
OK invalid/too-many-series.json
OK invalid/treemap-negative-value.json
OK invalid/unknown-field.json
OK invalid/unknown-type.json
OK invalid/wrong-data-type.json
101/101 fixtures passed
Exit: 0
```

```sh
node scripts/dev/charts-render-test.ts
```
```text
charts-render-test: 82 fixtures passed, 0 failure(s)
Exit: 0
```

```sh
node scripts/dev/charts-scatter-test.ts
```
```text
charts-scatter-test: 7 scatter edge cases, 4 ranking cases passed
Exit: 0
```

```sh
node scripts/dev/charts-report.ts scatter ranking
```
```text
Wrote design-system/reports/charts/scatter.html (8 fixtures)
Wrote design-system/reports/charts/ranking.html (8 fixtures)
Exit: 0
```

```sh
node scripts/dev/charts-layout-check.mjs scatter ranking
```
```text
scatter 360px light: 8 charts, 0 issue(s)
scatter 360px dark: 8 charts, 0 issue(s)
scatter 1280px light: 8 charts, 0 issue(s)
scatter 1280px dark: 8 charts, 0 issue(s)
ranking 360px light: 8 charts, 0 issue(s)
ranking 360px dark: 8 charts, 0 issue(s)
ranking 1280px light: 8 charts, 0 issue(s)
ranking 1280px dark: 8 charts, 0 issue(s)
Exit: 0
```

```sh
node scripts/dev/charts-scatter-test.ts --browser
```
```text
charts-scatter-test: 7 scatter edge cases, 4 ranking cases passed
scatter 360px light: 0 review issue(s)
scatter 360px dark: 0 review issue(s)
scatter 1280px light: 0 review issue(s)
scatter 1280px dark: 0 review issue(s)
ranking 360px light: 0 review issue(s)
ranking 360px dark: 0 review issue(s)
ranking 1280px light: 0 review issue(s)
ranking 1280px dark: 0 review issue(s)
Exit: 0
```

```sh
grep -rnE '#[0-9a-fA-F]{3,8}\b|box-shadow|gradient|!important' design-system/charts/render \
  design-system/charts/css design-system/charts/layout
```
```text
(sin salida)
Exit: 1
```

```sh
awk 'length > 100 { print FILENAME ":" FNR ":" length }' \
  design-system/charts/render/{scatter,ranking}.ts design-system/charts/css/{scatter,ranking}.css \
  scripts/dev/charts-scatter-test.ts design-system/components/ig-chart-{scatter,ranking}.md
```
```text
(sin salida)
Exit: 0
```

## Capturas revisadas

Se abrieron las ocho capturas: 360 y 1280 px, claro y oscuro, para ambos tipos.
En scatter.dense solo aparecen ocho referencias numeradas y ocho entradas con nombre y coordenadas;
la nube se reconoce sin la lista de sesenta entradas. Los destacados mantienen el anillo circular.
En scatter.negative, South y Sur quedan encima del punto inferior derecho, con separación visible.
El título X acompaña a los ticks en todos los casos. Las nubes sin destacados no tienen lista
visible.
En ranking, los valores siguen el extremo de las barras y comparten su centro vertical, también
cuando las etiquetas largas ocupan la fila superior en estrecho. Los negativos muestran el valor a
la izquierda de su barra. Se mantienen el borde del amarillo en claro y los textos legibles en
oscuro.
No se aprecian solapes, recortes ni los grandes huecos entre gráficos de la versión anterior.

```sh
node scripts/dev/shoot.mjs \
  file://$PWD/design-system/reports/charts/scatter.html \
  design-system/reports/charts/shots/scatter-360-light.png 360 light
```
```text
shoot: wrote shots/scatter-360-light.png (360x4193, light)
Exit: 0
```

```sh
node scripts/dev/shoot.mjs \
  file://$PWD/design-system/reports/charts/scatter.html \
  design-system/reports/charts/shots/scatter-360-dark.png 360 dark
```
```text
shoot: wrote shots/scatter-360-dark.png (360x4193, dark)
Exit: 0
```

```sh
node scripts/dev/shoot.mjs \
  file://$PWD/design-system/reports/charts/scatter.html \
  design-system/reports/charts/shots/scatter-1280-light.png 1280 light
```
```text
shoot: wrote shots/scatter-1280-light.png (1280x4193, light)
Exit: 0
```

```sh
node scripts/dev/shoot.mjs \
  file://$PWD/design-system/reports/charts/scatter.html \
  design-system/reports/charts/shots/scatter-1280-dark.png 1280 dark
```
```text
shoot: wrote shots/scatter-1280-dark.png (1280x4193, dark)
Exit: 0
```

```sh
node scripts/dev/shoot.mjs \
  file://$PWD/design-system/reports/charts/ranking.html \
  design-system/reports/charts/shots/ranking-360-light.png 360 light
```
```text
shoot: wrote shots/ranking-360-light.png (360x4342, light)
Exit: 0
```

```sh
node scripts/dev/shoot.mjs \
  file://$PWD/design-system/reports/charts/ranking.html \
  design-system/reports/charts/shots/ranking-360-dark.png 360 dark
```
```text
shoot: wrote shots/ranking-360-dark.png (360x4342, dark)
Exit: 0
```

```sh
node scripts/dev/shoot.mjs \
  file://$PWD/design-system/reports/charts/ranking.html \
  design-system/reports/charts/shots/ranking-1280-light.png 1280 light
```
```text
shoot: wrote shots/ranking-1280-light.png (1280x3152, light)
Exit: 0
```

```sh
node scripts/dev/shoot.mjs \
  file://$PWD/design-system/reports/charts/ranking.html \
  design-system/reports/charts/shots/ranking-1280-dark.png 1280 dark
```
```text
shoot: wrote shots/ranking-1280-dark.png (1280x3152, dark)
Exit: 0
```

No quedan bloqueos ni trabajo pendiente dentro del alcance de esta corrección.
