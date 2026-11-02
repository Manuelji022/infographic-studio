# Treemap: entrega de la tarea 2.E

Implementado squarify determinista en dos niveles, con grupos rectangulares, normalización,
orden descendente estable y grupo implícito al final. El render es HTML puro, emplea tokens,
formatea números por idioma y mantiene cada nombre y valor en la celda o en «También».

Se añaden cinco pares de fixtures: single, dominant, tiny, no-groups y data6; ficha del
componente y prueba de 60 combinaciones de datos y relaciones de aspecto. Las comprobaciones
incluyen teselación, proporcionalidad, contención por grupo, determinismo, texto visible y
accesible, ausencia de etiquetas sobre data-6, prioridad de highlight, highlight-soft y negative.

El plot mide 481 × 400 px en ancho y 280 × 320 px en estrecho. Se acota su ancho para conservar
la relación física usada por squarify incluso en contenedores más grandes. La mayor altura
relativa en estrecho permite una lectura vertical más natural. Cada banda calcula etiquetas
por separado con fits; ambas incluyen veinte píxeles de margen al medir.

El borde interior usa outline para no imponer un tamaño mínimo de cuatro píxeles a las
celdas diminutas. Los amarillos inferiores a ocho píxeles usan relleno neutro, conservando
sus datos en la lista anexa. Se mantiene el borde fuerte del amarillo en ambos temas.

## Validación

La salida completa de todos los comandos está en `treemap.validation.txt`.

```text
pnpm next typegen && pnpm tsc --noEmit: exit 0
pnpm lint: exit 0
charts-schema-test: 99/99 fixtures passed
charts-render-test: 80 fixtures passed, 0 failure(s)
charts-treemap-test: 60 geometry cases, visible/table data passed
charts-report treemap: 12 fixtures
charts-layout-check treemap:
  360px light: 12 charts, 0 issue(s)
  360px dark: 12 charts, 0 issue(s)
  1280px light: 12 charts, 0 issue(s)
  1280px dark: 12 charts, 0 issue(s)
grep de colores/sombras/gradientes/important: sin salida (exit 1 = ninguna coincidencia)
awk de líneas > 100 en código, CSS, ficha y fixtures: sin salida (exit 0)
```

Artefactos repetibles: `treemap.html`, `treemap.layout.json` y cuatro capturas
`shots/treemap-{360,1280}-{light,dark}.png`.

## Revisión visual

Abiertas las cuatro capturas. En claro y oscuro, los grupos forman bloques continuos sin
huecos inesperados y los nombres y valores tienen margen respecto al borde. El fixture de
99 % conserva el rectángulo secundario sin forzar una etiqueta diminuta. El singleton ocupa
toda el área. El fixture data6 muestra dos rellenos sin texto y ambos datos en «También».

En estrecho, más etiquetas pasan a «También» y la leyenda se adapta en varias líneas sin
recortes ni solapes. En ancho, el plot permanece centrado a su ancho físico de 481 px.
En tiny se aprecia el bloque dominante y una franja de celdas pequeñas, con la lista completa
de categorías debajo; es la representación proporcional esperada para estos valores.
No quedan bloqueos ni cambios pendientes dentro del ámbito de la tarea.
