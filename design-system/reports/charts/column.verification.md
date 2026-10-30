# Verificación 2.B-fix2: valores visibles sin duplicación

La leyenda por categoría incluye únicamente los segmentos sin texto interior.
Si todos los valores de una barra están dentro, no se añade esa línea de leyenda.
La leyenda general de nombres de serie aparece una vez al final del gráfico.
La prueba compara el multiconjunto de valores de cada variante con los datos normalizados:
cada dato tiene exactamente un valor visible, aunque varios datos compartan la misma cifra.
También comprueba la ausencia de leyendas redundantes en highlight-free y la leyenda general.

## Revisión visual

Capturas regeneradas para ambos tipos en 360/1280 y claro/oscuro.
Comando utilizado para cada combinación:
```sh
node scripts/dev/shoot.mjs file://$PWD/design-system/reports/charts/<tipo>.html \
  design-system/reports/charts/shots/<tipo>-<ancho>-<tema>.png <ancho> <tema>
```

## Salidas de aceptación

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
(node:29078) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of
file:///Users/manueljimenezlopez/orca/workspaces/infographic-studio/turbot/scripts/dev/charts-
schema-test.ts is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to
/Users/manueljimenezlopez/orca/workspaces/infographic-studio/turbot/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
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
(node:29122) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of
file:///Users/manueljimenezlopez/orca/workspaces/infographic-studio/turbot/scripts/dev/charts-
render-test.ts is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to
/Users/manueljimenezlopez/orca/workspaces/infographic-studio/turbot/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
charts-render-test: 82 fixtures passed, 0 failure(s)
Exit: 0
```

```sh
node scripts/dev/charts-column-test.ts
```
```text
(node:29236) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of
file:///Users/manueljimenezlopez/orca/workspaces/infographic-studio/turbot/scripts/dev/charts-
column-test.ts is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to
/Users/manueljimenezlopez/orca/workspaces/infographic-studio/turbot/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
charts-column-test: 40 cases passed, 0 failures
Exit: 0
```

```sh
node scripts/dev/charts-report.ts column stacked && node scripts/dev/charts-layout-check.mjs
column stacked
```
```text
(node:29238) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of
file:///Users/manueljimenezlopez/orca/workspaces/infographic-studio/turbot/scripts/dev/charts-
report.ts is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to
/Users/manueljimenezlopez/orca/workspaces/infographic-studio/turbot/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
Wrote design-system/reports/charts/column.html (8 fixtures)
Wrote design-system/reports/charts/stacked.html (14 fixtures)
column 360px light: 8 charts, 0 issue(s)
column 360px dark: 8 charts, 0 issue(s)
column 1280px light: 8 charts, 0 issue(s)
column 1280px dark: 8 charts, 0 issue(s)
stacked 360px light: 14 charts, 0 issue(s)
stacked 360px dark: 14 charts, 0 issue(s)
stacked 1280px light: 14 charts, 0 issue(s)
stacked 1280px dark: 14 charts, 0 issue(s)
Exit: 0
```

```sh
grep -rnE '#[0-9a-fA-F]{3,8}\b|box-shadow|gradient|!important' design-system/charts/render design-
system/charts/css design-system/charts/layout
```
```text
Exit: 1 (sin coincidencias)
```

```sh
awk 'length > 100' design-system/charts/render/stacked.ts scripts/dev/charts-column-test.ts
design-system/components/ig-chart-stacked.md
```
```text
Exit: 0
```


## Resultado de inspección de las ocho capturas

Abrí las ocho imágenes regeneradas: columnas conserva su disposición anterior sin regresiones.
En stacked.highlight-free cada barra muestra sus dos valores dentro, sin línea inferior repetida.
En stacked.bar.tiny solo el segmento del 0,3 % necesita texto exterior; los demás quedan dentro.
La sexta serie mantiene su valor en la leyenda por categoría; la leyenda general aparece una vez.
No observé solapes, recortes ni problemas de separación o contraste en claro u oscuro.

```text
shoot: wrote design-system/reports/charts/shots/column-360-light.png
shoot: wrote design-system/reports/charts/shots/column-360-dark.png
shoot: wrote design-system/reports/charts/shots/column-1280-light.png
shoot: wrote design-system/reports/charts/shots/column-1280-dark.png
shoot: wrote design-system/reports/charts/shots/stacked-360-light.png
shoot: wrote design-system/reports/charts/shots/stacked-360-dark.png
shoot: wrote design-system/reports/charts/shots/stacked-1280-light.png
shoot: wrote design-system/reports/charts/shots/stacked-1280-dark.png
```
