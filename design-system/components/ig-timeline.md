# ig-timeline

## Proposito
Presentar hitos ordenados temporalmente en una línea vertical.

## Marcado canonico
```html
<ol class="ig-timeline">
  <li class="ig-timeline__item">
    <span class="ig-timeline__date">1985</span><p class="ig-timeline__text">Hito</p>
  </li>
  <li class="ig-timeline__item ig-timeline__item--now">...</li>
</ol>
```

## Variantes y estados
- `ig-timeline__item--now`: marca el punto actual con `--ds-accent` y resalta su fecha con `--ds-text`.

## Accesibilidad
Usa una lista ordenada y conserva fecha e hito como texto: los puntos y la línea son decorativos. No
comuniques el estado actual solo por color; identifícalo en la fecha o en el texto del hito. Verifica
contraste AA de `--ds-text-muted`, `--ds-text` y `--ds-accent` sobre el fondo. El orden del DOM debe ser
cronológico.

## Cuando usarlo y cuando no
Úsalo para tres o más hitos en secuencia; combínalo con `ig-section`, `ig-card` o `ig-callout`.
Para comparar únicamente dos valores usa `ig-change`.
