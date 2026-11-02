# ig-header

## Proposito
Presenta la tesis principal de la infografía mediante un titular contundente y una entradilla.

## Marcado canonico
```html
<header class="ig-header"><h1 class="ig-header__title">Titular</h1>
<p class="ig-header__lede">Entradilla</p></header>
```

## Variantes y estados
No tiene variantes. El titular usa tipografía display y la entradilla tipografía serif de subtítulo.

## Accesibilidad
Mantén el titular como texto visible y usa un único h1. El borde usa `--ds-text` sobre el fondo; conserva
contraste AA también para `--ds-text-muted` de la entradilla.

## Cuando usarlo y cuando no
Úsalo una vez al inicio. Combínalo con `ig-section` para desarrollar la tesis; no sustituye al veredicto.
