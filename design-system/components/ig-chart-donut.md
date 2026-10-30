# ig-chart-donut

## Propósito
Mostrar cómo se reparte un todo entre dos y seis partes positivas, con total central y leyenda.

## Spec
`parts` conserva el orden de lectura; cada parte tiene `label`, `value` y `emphasis` opcional.
`total` permite una etiqueta y cifra central explícitas. Sin él se muestra la suma, sin etiqueta.
Los campos comunes incluyen título, descripción, unidad, fuente y nota opcional.

```json
{
  "id": "reparto", "type": "donut", "title": "Reparto del presupuesto",
  "sourceQuote": "Fuente: presupuesto aprobado.",
  "parts": [{ "label": "Servicios", "value": 65 }, { "label": "Otros", "value": 35 }]
}
```

## Marcado
Salida abreviada de `renderChart(spec, { locale: "es" })`:

```html
<figure class="ig-chart ig-chart--donut">
  <h3 class="ig-chart__title">Reparto del presupuesto</h3>
  <div class="ig-chart__body" role="img" aria-labelledby="chart-reparto-title">
    <div class="ig-chart__donut-layout">
      <div class="ig-chart__donut-ring">
        <svg class="ig-chart__donut-svg" viewBox="0 0 100 100" aria-hidden="true">…</svg>
        <div class="ig-chart__donut-total">100</div>
      </div>
      <ul class="ig-chart__donut-legend">…</ul>
    </div>
  </div>
  <table class="ig-chart__table">…</table>
</figure>
```

## Variantes y estados
La leyenda queda al lado a partir de 481 px y debajo en estrecho, sin truncar etiquetas.
El anillo mide 220 × 220 px y comienza a las doce, en sentido horario.
`ig-chart__s1` a `ig-chart__s6` distinguen partes; `highlight` y `negative` prevalecen.
El borde usa `--ds-chart-gap` y separa sectores aproximadamente dos píxeles.
Una parte menor del 1 % recibe un arco mínimo de tres grados: la leyenda conserva el dato real.
Para `highlight` el mínimo es diez grados, preservando ocho píxeles tras separar sectores.
Este mínimo es una ayuda visual, no una escala lineal ni una medida exacta del arco pequeño.
No hay estado proyectado ni interacción.

## Accesibilidad
Cada parte muestra nombre, valor y porcentaje, en el mismo orden que la tabla accesible.
El cuerpo tiene `role="img"`, asociado al título y descripción; el SVG decorativo se oculta.
La cifra central usa la unidad del spec. Los porcentajes se calculan sobre la suma de partes.
Los datos nunca dependen solo del color ni se escriben sobre sectores.

## Cuándo usarlo y cuándo no
Úsalo para explicar proporciones de un todo con pocas partes.
Para comparar diferencias pequeñas o muchas categorías, usa barras o un ranking.
No representa valores negativos, evolución temporal ni una escala lineal.
