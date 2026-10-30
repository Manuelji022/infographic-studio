# ig-grid

## Proposito
Distribuye tarjetas u otros bloques en columnas adaptables, con un mínimo de 230 px cuando el espacio
lo permite.

## Marcado canonico
```html
<div class="ig-grid">...ig-card (u otros)...</div>
```

## Variantes y estados
No tiene variantes. Usa columnas auto-fit y separación `--ds-spacing-16`; cada columna no supera el ancho
 disponible.

## Accesibilidad
El orden de lectura sigue el orden del marcado. Comprueba que cada hijo mantiene contraste AA entre texto
y superficie, también al reordenarse visualmente por el ajuste de columnas.

## Cuando usarlo y cuando no
Úsala dentro de `ig-section` para bloques relacionados; puede contener `ig-card` u otros contenidos. No
la uses para imponer un orden narrativo distinto del orden DOM.
