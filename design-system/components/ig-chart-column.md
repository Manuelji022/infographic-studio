# ig-chart-column

## Propósito
Comparar magnitudes por categoría con una a cuatro series de columnas agrupadas.

## Spec
`categories` contiene de 1 a 12 etiquetas únicas; cada serie tiene `name` y un valor finito
por categoría. Admite negativos. `unit` controla el formato de valores y ticks.

```json
{"id":"ventas","type":"column","title":"Ventas","sourceQuote":"Informe anual",
 "categories":["Enero","Febrero"],"series":[{"name":"Ventas","values":[12,-5]}]}
```

## Marcado
Salida abreviada de `renderChart(spec, { locale: "es" })`:

```html
<figure class="ig-chart ig-chart--column">
  <h3 class="ig-chart__title">Ventas</h3>
  <div class="ig-chart__body" role="img" aria-labelledby="chart-ventas-title">
    <div class="ig-chart__wide"><div class="ig-chart__plot ig-chart__column-plot">
      <svg class="ig-chart__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <!-- rejilla, eje cero y rectángulos ig-chart__column-bar ig-chart__s1 -->
      </svg><!-- etiquetas y valores HTML -->
    </div></div>
  </div><table class="ig-chart__table"><!-- datos completos --></table>
</figure>
```

## Variantes y estados
La escala usa `niceDomain` con cero incluido y cinco ticks como máximo. Cada valor positivo
va encima de su columna y cada negativo debajo; el eje cero separa ambas direcciones.

La banda ancha empieza en 481 px. La estrecha ocupa hasta 480 px y se calcula para 280 px.
En cada banda hay un único plot con todas las categorías, o filas horizontales agrupadas.
Nunca se divide un gráfico en filas de columnas con ejes repetidos.

El margen izquierdo del plot mide el tick más ancho con `TICK_FONT` más 8 px; conserva ese
ancho en píxeles al crecer el gráfico. El ancho disponible es el mínimo de banda menos ese
margen. Cada grupo requiere el máximo entre el ancho de categoría y el ancho de valor más
12 px multiplicado por series, más 16 px. Si supera el disponible dividido por categorías,
o alguna categoría no cabe en una línea en esa banda menos 8 px según `fits`, toda la banda
usa filas horizontales agrupadas. Esta decisión se aplica también en ancho.

Cada grupo horizontal conserva la categoría encima de sus barras. El valor positivo sigue
inmediatamente al extremo derecho de su barra; el negativo precede su extremo izquierdo.
Se reserva espacio para el valor más ancho en cada lado con datos de ese signo; no hay
columna fija de valores.
Con varias series hay leyenda. No hay énfasis ni previsiones en el schema de columnas.

## Accesibilidad
Título y descripción nombran el cuerpo `role="img"`. Los valores son texto HTML visible,
con formato local; la tabla oculta conserva todos los datos. El color acompaña a nombres,
valores y una leyenda cuando hay más de una serie. El SVG decorativo está oculto al lector.

## Cuándo usarlo y cuándo no
Úsalo para comparar categorías discretas, con signo o sin él. Para una evolución continua
usa líneas; para partes de un total usa apiladas. Para barras horizontales sencillas existe
`ig-bar-chart`.
