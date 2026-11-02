# Verificación de line

Render de líneas, diez fixtures bilingües nuevos, ficha y pruebas de geometría y datos.

Las cuatro capturas se inspeccionaron: etiquetas separadas, huecos y puntos aislados visibles,
previsiones discontinuas y eje cero reforzado. Los nombres largos pasan a leyenda en móvil.
La primera comprobación detectó 2 px de desbordamiento por la marca del extremo: corregido.
Un typecheck inicial señaló un archivo ajeno (charts-donut-test.ts); la pasada final está limpia.

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
99/99 fixtures passed
Exit: 0
```

```sh
node scripts/dev/charts-render-test.ts
```
```text
charts-render-test: 80 fixtures passed, 0 failure(s)
Exit: 0
```

```sh
node scripts/dev/charts-line-test.ts
```
```text
charts-line-test: 13 checks passed, 0 failures
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
grep -rnE '#[0-9a-fA-F]{3,8}\b|box-shadow|gradient|!important' design-system/charts/render \
design-system/charts/css design-system/charts/layout
```
```text
(sin salida)
Exit: 1
```

```sh
awk 'length > 100' design-system/charts/render/line.ts design-system/charts/css/line.css \
scripts/dev/charts-line-test.ts design-system/components/ig-chart-line.md \
design-system/charts/fixtures/valid/line.*.json
```
```text
(sin salida)
Exit: 0
```


Las capturas finales se regeneraron tras quitar la leyenda redundante de la serie única.
