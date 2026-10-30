# ig-card

## Proposito
Superficie base para presentar un bloque breve de contenido dentro de la infografía.

## Marcado canonico
```html
<div class="ig-card"><h3 class="ig-card__title">Titulo</h3>
<p class="ig-card__text">Texto</p></div>
```

## Variantes y estados
- `ig-card--feature`: aplica `--ds-surface-feature`; destaca contenido principal.
- `ig-card--deep`: aplica `--ds-surface-deep`; úsala para una superficie profunda.
- Sin modificador: superficie `--ds-surface`, borde `--ds-border`.

## Accesibilidad
El texto permanece visible; conserva contraste AA entre texto (`--ds-text`) y cada superficie. Coloca el h3
según la jerarquía real de encabezados, no solo por su apariencia.

## Cuando usarlo y cuando no
Combínala con `ig-grid` para tarjetas hermanas o dentro de `ig-section`. No la uses como sustituto del
cierre de alto contraste `ig-verdict`.
