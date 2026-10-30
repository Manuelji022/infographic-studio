# Correcciones de revisión de line
Años sin agrupación en ambos idiomas, marcas centradas y margen derecho de 4 px en móvil.
El rango vertical pasa de 16–84 % a 8–92 %; las etiquetas X bajan de 94 % a 96 %.
En un plot de 400 px el texto X acaba a unos 399 px, con holgura inferior de 1 px.
El margen superior de 32 px aloja las etiquetas iniciales y finales.
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
node scripts/dev/charts-line-test.ts
```
```text
charts-line-test: 15 checks passed, 0 failures
Exit: 0
```
```sh
node scripts/dev/charts-report.ts line && node scripts/dev/charts-layout-check.mjs line
```
```text
Wrote design-system/reports/charts/line.html (12 fixtures)
line 360px light: 12 charts, 0 issue(s)
line 360px dark: 12 charts, 0 issue(s)
line 1280px light: 12 charts, 0 issue(s)
line 1280px dark: 12 charts, 0 issue(s)
Exit: 0
```
```sh
node scripts/dev/shoot.mjs file://$PWD/design-system/reports/charts/line.html \
design-system/reports/charts/shots/line-360-light.png 360 light
```
```text
shoot: wrote design-system/reports/charts/shots/line-360-light.png (360x6762, light) final url: \
file:///Users/manueljimenezlopez/orca/workspaces/infographic-studio/turbot/design-system/reports/charts/line.html
Exit: 0
```
```sh
node scripts/dev/shoot.mjs file://$PWD/design-system/reports/charts/line.html \
design-system/reports/charts/shots/line-360-dark.png 360 dark
```
```text
shoot: wrote design-system/reports/charts/shots/line-360-dark.png (360x6762, dark) final url: \
file:///Users/manueljimenezlopez/orca/workspaces/infographic-studio/turbot/design-system/reports/charts/line.html
Exit: 0
```
```sh
node scripts/dev/shoot.mjs file://$PWD/design-system/reports/charts/line.html \
design-system/reports/charts/shots/line-1280-light.png 1280 light
```
```text
shoot: wrote design-system/reports/charts/shots/line-1280-light.png (1280x6402, light) final \
url: \
file:///Users/manueljimenezlopez/orca/workspaces/infographic-studio/turbot/design-system/reports/charts/line.html
Exit: 0
```
```sh
node scripts/dev/shoot.mjs file://$PWD/design-system/reports/charts/line.html \
design-system/reports/charts/shots/line-1280-dark.png 1280 dark
```
```text
shoot: wrote design-system/reports/charts/shots/line-1280-dark.png (1280x6402, dark) final url: \
file:///Users/manueljimenezlopez/orca/workspaces/infographic-studio/turbot/design-system/reports/charts/line.html
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
awk 'length > 100' design-system/charts/render/line.ts design-system/charts/css/line.css \
scripts/dev/charts-line-test.ts
```
```text
(sin salida)
Exit: 0
```

Inspección visual de las cuatro capturas finales: años EN como «2018» y «2024», sin comas.
El último punto está centrado sobre el extremo del segmento y conserva espacio al borde móvil.
La rejilla ocupa más altura; bajo los años queda solo una franja mínima antes del siguiente bloque.
Los extremos siguen separados, las leyendas móviles caben y no aparecen recortes ni solapes.
Los trazos continuos, discontinuos y los puntos aislados se distinguen en ambos temas.
