# Select

## Propósito
Selector nativo de una opción con indicador visual de despliegue.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| Props nativas | `ComponentProps<"select">` | — | Atributos HTML; incluir opciones como hijos. |

## Variantes y estados
Normal, inválido con `aria-invalid="true"` y deshabilitado con `disabled`.

## Accesibilidad
Es un elemento `select` nativo, operable por teclado. El chevron es decorativo y se oculta
a tecnologías de asistencia; mantener etiqueta y mensaje textual de error.

## Cuándo usarlo y cuándo no
Usar para elegir entre opciones predefinidas. No usar si la lista necesita búsqueda o
selección múltiple compleja.

## Estilo Paper
Con `data-ds-style="paper"`: altura 40 px, radio `--ds-paper-radius-md`, relleno horizontal 12 px (32 px a la derecha por el chevron), texto `ui-sm`, fondo `surface` y borde `border-strong` de 1 px. Hover oscurece el borde (`text-subtle`) salvo en foco o inválido, que conservan su borde; el foco usa borde `focus-ring` más un anillo de 1 px (2 px visibles); inválido usa `danger` con el mismo grosor; deshabilitado usa `control` sobre `surface` y `text-disabled`. Sin cambios de API. Las reglas Paper usan `@scope` (de `data-ds-style="paper"` hasta un `data-ds-style="studio"` anidado), así que un subárbol Studio dentro de Paper conserva su aspecto.
