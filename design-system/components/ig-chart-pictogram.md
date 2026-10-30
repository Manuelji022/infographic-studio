# ig-chart-pictogram

## Propósito
Comunicar una proporción de diez o cien mediante una rejilla de iconos y una cifra explícita.

## Spec
`of` es 10 o 100; `value` está entre cero y ese total.
Con diez iconos se admite un decimal; con cien, solo valores enteros.
`label` describe la población e `icon` acepta `person`, `square` o `circle`.
Los campos comunes incluyen título, descripción, unidad, fuente y nota opcional.
`value` siempre es un recuento sobre `of`, aunque `unit.kind` sea `percent`.
Se muestran recuento y porcentaje calculado como `value / of × 100`.
El recuento usa cero o un decimal; el porcentaje respeta `unit.decimals` si existe.
Por defecto el porcentaje usa cero decimales, o uno para recuentos decimales sobre diez.

```json
{
  "id": "participacion", "type": "pictogram", "title": "Participación",
  "sourceQuote": "Fuente: encuesta.", "of": 10, "value": 7.5,
  "label": "Personas participantes", "icon": "person"
}
```

## Marcado
Salida abreviada de `renderChart(spec, { locale: "es" })`:

```html
<figure class="ig-chart ig-chart--pictogram">
  <h3 class="ig-chart__title">Participación</h3>
  <div class="ig-chart__body" role="img" aria-labelledby="chart-participacion-title">
    <div class="ig-chart__pictogram-summary"><strong>7,5 de 10</strong>…</div>
    <div class="ig-chart__pictogram-grid" aria-hidden="true">
      <span class="ig-chart__pictogram-icon ig-chart__pictogram-person">…</span>
    </div>
  </div>
  <table class="ig-chart__table">…</table>
</figure>
```

## Variantes y estados
Diez iconos forman una fila de diez; cien forman una rejilla de diez por diez.
Las celdas miden 20 × 24 px y la separación es 6 px: la rejilla cabe en 280 px.
El icono `person` usa SVG inline propio; cuadrados y círculos se dibujan con CSS.
`ig-chart__s1` rellena los iconos activos; `ig-chart__neutral` y borde marcan los restantes.
Un decimal recorta horizontalmente el icono siguiente: 7,5 da siete completos y uno a la mitad.
Cero deja todos neutros y el máximo llena todos. No hay escala lineal ni estado proyectado.

## Accesibilidad
La cifra grande y `label` explican la proporción sin contar iconos ni depender del color.
El cuerpo tiene `role="img"`, asociado al título y descripción; la rejilla es decorativa.
La tabla accesible incluye etiqueta, conteo, denominador y porcentaje.
Los SVG no requieren imágenes, fuentes de iconos ni recursos externos.

## Cuándo usarlo y cuándo no
Úsalo para frecuencias sencillas y proporciones memorables de diez o cien.
Para precisión con muchos decimales o comparación entre categorías, usa barras o columnas.
No representa totales arbitrarios, datos negativos ni series temporales.
