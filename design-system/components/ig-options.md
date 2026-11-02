# ig-options

## Proposito
Mostrar dos o más alternativas paralelas, cada una con título y explicación.

## Marcado canonico
```html
<div class="ig-options">
  <div class="ig-options__item">
    <h3 class="ig-options__title">Alternativa</h3>
    <p class="ig-options__text">Explicacion</p>
  </div>
  ...
</div>
```

## Variantes y estados
No tiene variantes CSS propias.

## Accesibilidad
Escribe cada alternativa y explicación como texto visible; no diferencies opciones solo por color o
posición. Verifica contraste AA de los tokens de texto frente al fondo. Mantén cada título junto a su
explicación y presenta las opciones en el orden de lectura deseado.

## Cuando usarlo y cuando no
Úsalo cuando haya al menos dos alternativas comparables; combínalo con `ig-section` y, si aporta contexto,
`ig-callout`. No lo uses para una secuencia temporal (`ig-timeline`) ni para representar magnitudes
(`ig-bar-chart`).
