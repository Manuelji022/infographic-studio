# ig-stat

## Proposito
Destacar una cifra clave con una etiqueta que explique qué representa.

## Marcado canonico
```html
<div class="ig-stat"><p class="ig-stat__value">2,7x</p>
  <p class="ig-stat__label">Descripcion de la cifra</p></div>
```

## Variantes y estados
No tiene variantes CSS propias.

## Accesibilidad
La cifra y su unidad deben aparecer como texto, no solo como recurso visual; la etiqueta contextualiza
su significado. Se usa `--ds-text` para la cifra y `--ds-text-muted` para la etiqueta: comprueba contraste
AA de ambos pares con el fondo. La cifra se lee antes que la etiqueta.

## Cuando usarlo y cuando no
Úsalo para una métrica central; combínalo con `ig-section`, `ig-card` o `ig-callout` según el contexto.
Para comparar varias categorías usa `ig-bar-chart`, y para comunicar un cambio entre dos valores usa
`ig-change`.
