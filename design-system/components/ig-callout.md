# ig-callout

## Proposito
Añadir una nota que explique o destaque un dato relacionado con el contenido cercano.

## Marcado canonico
```html
<aside class="ig-callout">
  <p class="ig-callout__title">Titulo</p>
  <p class="ig-callout__text">Texto</p>
</aside>
<aside class="ig-callout ig-callout--neutral">
  <p class="ig-callout__title">Titulo</p>
  <p class="ig-callout__text">Texto</p>
</aside>
```

## Variantes y estados
- `ig-callout--neutral`: estilo neutro, sin el color lateral semántico de la variante base.

## Accesibilidad
El título y el texto deben explicar el significado sin depender del borde/color. Mantén el orden título y
luego texto. Verifica contraste AA de los tokens de texto y del borde semántico sobre el fondo usado.

## Cuando usarlo y cuando no
Úsalo para explicar un dato en relación con un gráfico o bloque; combínalo con `ig-bar-chart`, `ig-stat`,
`ig-change`, `ig-timeline` o `ig-section`. No lo uses como sustituto de la conclusión principal de
`ig-verdict`.
