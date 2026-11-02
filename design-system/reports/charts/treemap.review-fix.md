# Treemap: correcciones de revisión 2.E

Se corrigieron el ancho del plot, el alcance del amarillo suave y la tipografía.
El plot usa `width: 100%`, alineación izquierda y un máximo de 800 px.
La geometría y las etiquetas se deciden a 481 × 300 px y 280 × 320 px.
El máximo limita el alto de escritorio a 499 px y mantiene un tamaño manejable.

`highlight-soft` solo corresponde a grupos cuyo tono es `highlight`.
El caso sintético comprueba las tres clases de énfasis en ambas bandas; el nuevo par
`treemap.item-highlight.es/en.json` permite revisar el caso también en Chrome.
Las hermanas de un item destacado en `data-2` mantienen el tono de la leyenda.
La etiqueta hereda todos los atributos tipográficos del rol global label (12 px / 15 px).

## Espaciado

La medida DOM previa está en `treemap.spacing-before.json` y la posterior en
`treemap.spacing-after.json`. El final de la figura coincide con el final de la leyenda.
La variante oculta mide cero y la tabla accesible mide 1 px y está fuera del flujo.
El hueco externo procede del margen entre hijos de `.ig-root` y del padding del informe.
El coordinador corrigió `charts-report.ts`: los casos comparten ahora un solo div.
Se regeneró el informe y desapareció el margen global entre casos.
Se retiró el margen inferior del plot; «También» recibe ahora su propio margen superior.

## Aceptación

La salida completa de los comandos está en `treemap.acceptance.txt`.

```text
$ pnpm next typegen && pnpm tsc --noEmit
Generating route types...
✓ Types generated successfully
Exit: 0

$ pnpm lint
$ eslint
Exit: 0

$ node scripts/dev/charts-schema-test.ts
101/101 fixtures passed
Exit: 0

$ node scripts/dev/charts-render-test.ts
charts-render-test: 82 fixtures passed, 0 failure(s)
Exit: 0

$ node scripts/dev/charts-treemap-test.ts
charts-treemap-test: 70 geometry cases, visible/table data passed
Exit: 0
```

El grep de colores y efectos no produjo salida (exit 1 significa cero coincidencias).
El awk de líneas mayores de cien caracteres tampoco produjo salida (exit 0).
Node avisa de MODULE_TYPELESS_PACKAGE_JSON; los comandos terminan correctamente.

## Revisión visual

Se abrieron las cuatro capturas completas y detalles ampliados de los fixtures.
En 360 px, el área aprovecha los 328 px interiores y conserva la proporción alta.
Los textos largos se parten por palabras, los valores quedan junto al nombre y los items
pequeños pasan a «También», sin superposición ni recorte.
En 1280 px, el área crece hasta 800 × 499 px y se alinea con título y leyenda.
El nuevo caso muestra amarillo solo en la celda destacada, el tono `data-2` en la hermana
y rojo en el item negativo. En oscuro, `data-2` cambia por token a un relleno claro,
con texto oscuro; el amarillo mantiene texto oscuro y el rojo texto claro.
Los casos `data-6` llevan sus etiquetas fuera del área en ambos temas.
El caso de treinta categorías conserva una lista larga necesaria para leer todos los datos.

```text
$ node scripts/dev/charts-report.ts treemap
Wrote design-system/reports/charts/treemap.html (14 fixtures)
$ node scripts/dev/charts-layout-check.mjs treemap
treemap 360px light: 14 charts, 0 issue(s)
treemap 360px dark: 14 charts, 0 issue(s)
treemap 1280px light: 14 charts, 0 issue(s)
treemap 1280px dark: 14 charts, 0 issue(s)
```

Capturas finales: `shots/treemap-360-light.png`, `shots/treemap-360-dark.png`,
`shots/treemap-1280-light.png` y `shots/treemap-1280-dark.png`.
Se volvieron a abrir tras la corrección común: no queda el hueco excesivo entre casos.
Las capturas miden 360 × 9192 px y 1280 × 10309 px respectivamente.

Comando reproducible para cada ancho (360/1280) y tema (light/dark):

```sh
node scripts/dev/shoot.mjs \
  "file://$PWD/design-system/reports/charts/treemap.html" \
  "design-system/reports/charts/shots/treemap-$ancho-$tema.png" "$ancho" "$tema"
```

Las cuatro ejecuciones finalizaron con exit 0 y sin avisos de desbordamiento horizontal.
