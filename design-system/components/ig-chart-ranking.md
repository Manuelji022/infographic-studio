# ig-chart-ranking

## Propósito
Comparar y ordenar hasta quince categorías mediante barras horizontales con una escala común.

## Spec
`items` contiene `label`, `value` finito y `emphasis` opcional (`highlight` o `negative`).
Las etiquetas son únicas y admiten hasta cuarenta caracteres. `order` es `asc` o `desc`.
Se admiten los campos comunes `title`, `description`, `unit`, `sourceQuote` y `note`.

```json
{
  "id": "inversion",
  "type": "ranking",
  "title": "Inversión por territorio",
  "sourceQuote": "Fuente: presupuesto de ejemplo.",
  "order": "desc",
  "unit": { "kind": "number", "suffix": "M€" },
  "items": [
    { "label": "Castilla y León", "value": 30, "emphasis": "highlight" },
    { "label": "Castilla-La Mancha", "value": 20 }
  ]
}
```

## Marcado
Salida abreviada de `renderChart(spec, { locale: "es" })`:

```html
<figure class="ig-chart ig-chart--ranking">
  <h3 class="ig-chart__title">Inversión por territorio</h3>
  <div class="ig-chart__body" role="img" aria-labelledby="chart-inversion-title">
    <ol class="ig-chart__ranking-list">
      <li class="ig-chart__ranking-row">
        <span class="ig-chart__ranking-position">1</span>
        <span class="ig-chart__label ig-chart__ranking-label">Castilla y León</span>
        <div class="ig-chart__ranking-track">
          <div class="ig-chart__ranking-scale">
            <span class="ig-chart__ranking-zero"></span>
            <span class="ig-chart__ranking-bar ig-chart__highlight"></span>
            <span class="ig-chart__value ig-chart__ranking-value">30 M€</span>
          </div>
        </div>
      </li>
    </ol>
  </div>
  <table class="ig-chart__table">…</table>
</figure>
```

## Variantes y estados
El render ordena los datos; los empates conservan el orden del spec.
En ancho la etiqueta ocupa una columna a la izquierda de la barra.
En estrecho ocupa una fila encima de la barra y puede partirse en varias líneas.
El valor se coloca a ocho píxeles del extremo de la barra, centrado verticalmente con ella.
Los negativos lo sitúan a la izquierda de su extremo; positivos y ceros, a la derecha.
Se reserva espacio lateral para los valores según su ancho de texto, sin columnas fijas.
La escala incluye cero: los negativos crecen a la izquierda de `ig-chart__ranking-zero`.
Las barras miden veinte píxeles de alto; el amarillo de `highlight` lleva borde.
`negative` aplica el token rojo; la posición y el signo del valor comunican también el saldo.
Los ceros conservan etiqueta y valor aunque su barra tenga longitud nula.

## Accesibilidad
Posición, nombre y valor son texto visible. La lista sigue el mismo orden que la tabla oculta.
El color no es necesario para leer ni comparar los datos. El valor externo usa el color de texto
normal del tema; no depende del contraste del relleno de la barra.

## Cuándo usarlo y cuándo no
Úsalo para clasificaciones y comparaciones de magnitudes con una unidad compartida.
Para relaciones entre dos variables usa dispersión; para mostrar composición usa un apilado.
