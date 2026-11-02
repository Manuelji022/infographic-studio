# ig-chart-scatter

## Propósito
Relacionar dos variables cuantitativas y señalar hasta ocho observaciones de interés.

## Spec
`x` e `y` tienen `label` y un `unit` opcional como sufijo. `points` contiene de uno a
sesenta pares `x`, `y` finitos; solo los destacados con `highlight` admiten `label`.
Las etiquetas son únicas y no superan cuarenta caracteres. Se admiten los campos comunes
`title`, `description`, `unit`, `sourceQuote` y `note`.

```json
{
  "id": "estudio",
  "type": "scatter",
  "title": "Estudio y resultados",
  "sourceQuote": "Fuente: encuesta de ejemplo.",
  "x": { "label": "Horas", "unit": "h" },
  "y": { "label": "Puntuación", "unit": "pt" },
  "points": [
    { "x": 2, "y": 60 },
    { "x": 5, "y": 85, "highlight": true, "label": "Media" }
  ]
}
```

## Marcado
Salida abreviada de `renderChart(spec, { locale: "es" })`:

```html
<figure class="ig-chart ig-chart--scatter">
  <h3 class="ig-chart__title">Estudio y resultados</h3>
  <div class="ig-chart__body" role="img" aria-labelledby="chart-estudio-title">
    <div class="ig-chart__wide">
      <div class="ig-chart__scatter-ytitle">Puntuación</div>
      <div class="ig-chart__plot ig-chart__scatter-plot">
        <svg class="ig-chart__svg" viewBox="0 0 100 100" preserveAspectRatio="none">…</svg>
        <span class="ig-chart__scatter-point ig-chart__s1">…</span>
        <span class="ig-chart__label ig-chart__scatter-tag">Media</span>
      </div>
      <div class="ig-chart__scatter-xtitle">Horas</div>
    </div>
    <div class="ig-chart__narrow">…</div>
  </div>
  <table class="ig-chart__table">…</table>
</figure>
```

`ig-chart__scatter-leaders` une cada etiqueta separada con su punto.
`ig-chart__scatter-xtick` e `ig-chart__scatter-ytick` alojan los ticks HTML.

## Variantes y estados
Los círculos tienen tamaño fijo en píxeles y siempre usan `ig-chart__s1`.
Los destacados añaden `ig-chart__scatter-point--focus`: círculo mayor y anillo exterior.
No usan amarillo. Se prueban derecha, izquierda, arriba y abajo del punto.
Se rechazan posiciones que cubran cualquier punto o una etiqueta ya colocada.
Si no hay espacio, aparecen números separados con líneas guía y una lista
`ig-chart__scatter-key` con «etiqueta: x / y», tanto en estrecho como en ancho si hace falta.
El estrecho reduce ticks según el ancho mínimo disponible, sin JavaScript.
Las escalas independientes admiten negativos, constantes y un solo punto.

## Accesibilidad
Ambos títulos de eje permanecen visibles; el de X está junto a sus ticks.
Solo los puntos destacados tienen texto visible. La lista numerada, cuando se necesita,
contiene exclusivamente destacados con su nombre y coordenadas formateadas por idioma y unidad.
El resto de valores se conserva únicamente en la tabla accesible, que incluye todos los puntos.
Es la excepción de dispersión a la regla general de valores visibles: el dato visual es la nube.
El contenedor accesible usa el título y la descripción para nombrar la imagen.

## Cuándo usarlo y cuándo no
Úsalo para explorar asociación, agrupaciones o valores atípicos de dos variables.
No implica causalidad. Para ordenar categorías usa ranking; para evolución temporal, líneas.
