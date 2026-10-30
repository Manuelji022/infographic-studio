# ig-bar-chart

## Proposito
Comparar magnitudes por categoría mediante barras horizontales; reservar `--projected` para previsiones.

## Marcado canonico
```html
<ul class="ig-bar-chart"><li class="ig-bar-chart__row"
  style="--ig-value:62;--ig-max:100"><span
  class="ig-bar-chart__label">Etiqueta</span><span
  class="ig-bar-chart__track"><span class="ig-bar-chart__bar"><span
  class="ig-bar-chart__value">62 %</span></span></span></li>...</ul>
```

## Variantes y estados
- `ig-bar-chart__row--projected`: borde discontinuo `--ds-data-1`, fondo `--ds-surface-feature` y valor en `--ds-text` para previsiones.
- `ig-bar-chart__row--series-2`, `ig-bar-chart__row--series-3`, `ig-bar-chart__row--series-4`:
  diferencian series con `--ds-data-2`, `--ds-data-3` y `--ds-data-4`.

## Datos
`--ig-value` es el valor de la barra y `--ig-max` el máximo de la escala (por defecto 100).
Ambos deben ser números no negativos; `--ig-value` no debería superar `--ig-max`.

## Accesibilidad
Mantén etiqueta y valor numérico como texto, sin depender del color o longitud de barra. El valor va en una pastilla `--ds-surface` con `--ds-text` (par AA verificado), independiente del color de la serie. El orden de la lista debe
seguir el orden lógico de lectura.

## Cuando usarlo y cuando no
Úsalo para comparar categorías con una escala común; acompáñalo de `ig-section` y, si hace falta,
`ig-callout`. Para una cifra única usa `ig-stat`; no uses barras si no existe comparación significativa.
