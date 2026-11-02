# ig-chart-line

## Propósito
Mostrar una o más series temporales o categóricas y destacar sus valores iniciales y finales.

## Spec
Campos propios: `x` define `kind` (`year` o `category`) y `values`; `series` contiene `name`,
`values` (los huecos se escriben `null`) y `projectedFrom` opcional.

```json
{"id":"ventas","type":"line","title":"Ventas","sourceQuote":"Fuente","x":
{"kind":"year","values":[2024,2025]},"series":[{"name":"Ventas","values":[2,4]}]}
```

## Marcado
`renderChart` devuelve un `figure.ig-chart--line`, un `ig-chart__plot`, SVG `ig-chart__svg`,
etiquetas HTML posicionadas, y una tabla accesible `ig-chart__table`. Las líneas y puntos usan
`ig-chart__s1`…`ig-chart__s6`; el tramo previsto añade `ig-chart__line-projected`.

## Variantes y estados
Se generan variantes ancha y estrecha. Las etiquetas del primer y último valor usan una pastilla
`--ds-surface`: se colocan sobre el máximo local de todas las series con 4 px de holgura; si no
caben arriba, se colocan debajo del mínimo local. La posición original queda como último recurso.
Los tramos desde `projectedFrom` son discontinuos y los valores `null` interrumpen la línea.

## Accesibilidad
El cuerpo tiene `role="img"` y referencias a título y descripción. La tabla oculta conserva todos
los valores como texto; los colores nunca son el único medio para distinguir series.

## Cuándo usarlo y cuándo no
Úsalo para evolución temporal o secuencias ordenadas. Para comparar categorías independientes,
usa columnas o barras; para muchos puntos sin orden, usa dispersión.
