# ig-chart-treemap

## Propósito

Mostrar la composición de un total en un periodo mediante áreas proporcionales, con grupos
opcionales. El total se normaliza: no es necesario que los valores sumen cien.

## Spec

Campos comunes: `id`, `type`, `title`, `sourceQuote`, `description`, `unit` y `note`.
`items` contiene entre uno y treinta objetos con `label`, `value > 0`, `group` y `emphasis`
opcionales. Cada `group` referencia un `id` de `groups`; los grupos tienen `label` y `tone`.
`period` permite mostrar el periodo como texto junto al gráfico.

```json
{
  "id": "gasto",
  "type": "treemap",
  "title": "Reparto del gasto",
  "sourceQuote": "Fuente: datos de ejemplo.",
  "period": "1996",
  "items": [
    { "label": "Sanidad", "value": 60 },
    { "label": "Educación", "value": 40 }
  ]
}
```

## Marcado

Salida abreviada de `renderChart(spec, { locale: "es" })`:

```html
<figure class="ig-chart ig-chart--treemap">
  <h3 class="ig-chart__title" id="chart-gasto-title">Reparto del gasto</h3>
  <div class="ig-chart__body" role="img" aria-labelledby="chart-gasto-title">
    <p class="ig-chart__treemap-period">1996</p>
    <div class="ig-chart__wide">
      <div class="ig-chart__plot ig-chart__treemap-wide">
        <div class="ig-chart__cell ig-chart__s1"
          style="left:0%;top:0%;width:60%;height:100%">
          <span class="ig-chart__label">Sanidad 60</span>
        </div>
      </div>
    </div>
    <!-- Variante ig-chart__narrow, leyenda de grupos y lista ig-chart__also. -->
  </div>
  <table class="ig-chart__table">...</table>
</figure>
```

## Variantes y estados

- El plot ocupa el 100 % del ancho disponible y se alinea a la izquierda, con un máximo
  de 800 px: limita el área a unos 499 px de alto en escritorio y mantiene la lectura cerca
  del título y la leyenda sin crear un bloque desmesurado.
- Ancho: relación 481 / 300. Estrecho: 280 / 320, más alta para facilitar la lectura.
  El squarify y las etiquetas se calculan a 481 × 300 y 280 × 320 px respectivamente.
  Al crecer el ancho se conserva la relación: las celdas crecen y el texto mantiene su tamaño.
- Los envoltorios `ig-chart__wide` y `ig-chart__narrow` cambian con container queries.
  La tipografía procede de los tokens del rol label (12 px y altura de línea de 15 px).
- Nombre y valor aparecen juntos si caben; en otro caso van a «También» como texto.
  Nunca hay texto sobre `data-6`. Los números usan el formato del idioma y la unidad.
- El color corresponde al tono del grupo. `highlight` destaca el item y aplica
  `highlight-soft` a sus hermanos solo si el tono del grupo es `highlight`. En grupos de
  datos, las hermanas conservan el tono del grupo. `negative` prevalece sobre ese tono.
  Los rellenos amarillos de menos de ocho píxeles se sustituyen por el tono neutro.
- Sin grupos se emplean las seis series por orden original y después el tono neutro.
  Los items sin grupo forman un grupo implícito al final del reparto.
- El orden de grupos e items es descendente por valor, con empates estables.
  Cada grupo ocupa un único rectángulo; el periodo y la leyenda permanecen visibles.

## Accesibilidad

El contenedor `role="img"` referencia título y descripción. La tabla accesible contiene
nombre, valor y grupo de todos los items. Todos los valores aparecen también en el gráfico
visible o en «También»; el relleno nunca es el único portador de información.
Los colores y sus pares de texto proceden de tokens semánticos en ambos temas.

## Cuándo usarlo y cuándo no

Úsalo para mostrar partes de un total con muchas categorías y agrupaciones jerárquicas
sencillas en un periodo. Para comparaciones precisas entre categorías usa un ranking;
para evolución temporal usa líneas. No admite ceros, negativos ni varios periodos.
