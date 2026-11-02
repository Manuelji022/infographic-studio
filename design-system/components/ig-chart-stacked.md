# ig-chart-stacked

## Propósito
Mostrar la composición de un total, en columnas por categoría o en una barra horizontal.

## Spec
`layout` es `columns` o `bar` (una categoría); `mode` es `absolute` o `percent`.
`series` admite entre dos y seis series, todas con valores no negativos y longitudes iguales.

```json
{"id":"reparto","type":"stacked","title":"Reparto","sourceQuote":"Informe anual",
 "layout":"bar","mode":"percent","categories":["Total"],
 "series":[{"name":"Grupo A","values":[60]},{"name":"Grupo B","values":[40]}]}
```

## Marcado
Salida abreviada de `renderChart(spec, { locale: "es" })`:

```html
<figure class="ig-chart ig-chart--stacked">
  <h3 class="ig-chart__title">Reparto</h3>
  <div class="ig-chart__body" role="img" aria-labelledby="chart-reparto-title">
    <div class="ig-chart__wide"><div class="ig-chart__plot ig-chart__stacked-bar">
      <div class="ig-chart__cell ig-chart__stacked-cell ig-chart__s1">
        <span class="ig-chart__value">60,0 %</span>
      </div><!-- más segmentos -->
    </div></div><!-- variante estrecha y leyenda con valores -->
  </div><table class="ig-chart__table"><!-- datos originales y normalizados --></table>
</figure>
```

## Variantes y estados
`percent` normaliza cada categoría a 100; una pila cuya suma es cero queda vacía y muestra
0 % por serie en su leyenda. No se divide por cero ni se inventa una distribución uniforme.
El formato predeterminado es porcentaje con un decimal, salvo que `unit` ya sea porcentaje.
`absolute` usa escala común y total sobre cada columna; la barra ocupa todo el ancho.

Cada banda se calcula al mínimo de 280 o 481 px. El margen izquierdo mide el tick más ancho
con `TICK_FONT` más 8 px y mantiene ese ancho en píxeles. El ancho restante se divide entre
categorías. Categoría, valores y total deben caber según `fits` en el 76 % de esa banda menos
12 px y una línea de alto. Si todos caben, hay un solo plot de columnas con todas las
categorías; si falla alguno, toda esa banda usa barras horizontales apiladas por categoría.
Nunca se repiten filas de columnas ni sus ejes. En absoluto las barras por categoría tienen
escala común; `layout: bar` conserva una única barra del ancho completo.
La altura de columnas es 320 px; cada barra horizontal mide 80 px. Las leyendas son en línea,
con salto natural cuando falta ancho, y no una lista vertical forzada.

Un valor va dentro solo si `fits` confirma espacio usando el ancho mínimo de la banda,
las dimensiones reales del segmento, 12 px de margen horizontal y 8 px verticales.
Nunca se escribe encima de la sexta serie. Los valores restantes aparecen en leyendas
visibles por categoría, solo con los segmentos sin valor dentro. Si todos los valores caben,
no se añade esa línea; la leyenda general de series aparece una sola vez.
Los segmentos usan `ig-chart__cell` y una separación del token `--ds-chart-gap`; el borde
se recorta al segmento para evitar desbordamiento en participaciones diminutas.
No hay énfasis ni previsiones en este schema.

## Accesibilidad
Cada serie conserva nombre, valor y color. Título y descripción nombran el cuerpo gráfico;
la tabla oculta incluye todos los valores originales y, en modo porcentual, los normalizados.
El texto sobre marcas usa `--chart-on`; la sexta serie se etiqueta fuera por contraste.

## Cuándo usarlo y cuándo no
Úsalo para comparar composiciones y totales. El modo porcentual compara proporciones;
el absoluto conserva diferencias entre totales. Para comparar valores individuales con
precisión usa columnas agrupadas; no uses apiladas para magnitudes negativas.
