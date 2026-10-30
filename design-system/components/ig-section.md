# ig-section

## Proposito
Agrupa contenido bajo un titular que expresa una conclusión y una línea que define medida y unidad.

## Marcado canonico
```html
<section class="ig-section"><h2 class="ig-section__title">Titular-conclusion</h2>
<p class="ig-section__measure">Que se mide y en que unidad</p> ...contenido...</section>
```

## Variantes y estados
No tiene variantes. Separa los hijos consecutivos mediante margen; la medida tiene estilo atenuado.

## Accesibilidad
Usa texto visible para titular y medida, con jerarquía h2 tras el h1. Verifica AA de `--ds-text-muted`
sobre el fondo y de `--ds-text` para el titular.

## Cuando usarlo y cuando no
Usa entre tres y seis secciones para desarrollar la tesis. Combínala con `ig-card`, `ig-grid` y componentes
de datos; no uses un tema genérico como titular.
