# Input

## Propósito
Control nativo de una línea para introducir datos.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| Props nativas | `ComponentProps<"input">` | — | Atributos HTML de entrada; `type` define el formato. |

## Variantes y estados
Admite estados normal, inválido mediante `aria-invalid="true"` y deshabilitado mediante
`disabled`. El placeholder usa texto atenuado; error compensa el borde de 2 px.

## Accesibilidad
Usar con etiqueta asociada y mensaje textual de error. El foco de teclado es visible.

## Cuándo usarlo y cuándo no
Usar para valores breves. Para texto extenso, usar `Textarea`.

## Estilo Paper
Con `data-ds-style="paper"`: altura 40 px, radio `--ds-paper-radius-md`, relleno horizontal 12 px, texto `ui-sm`, fondo `surface` y borde `border-strong` de 1 px. Hover oscurece el borde (`text-subtle`) salvo en foco o inválido, que conservan su borde; el foco usa borde `focus-ring` más un anillo de 1 px (2 px visibles); inválido usa `danger` con el mismo grosor; deshabilitado usa `control` sobre `surface` y `text-disabled`. Sin cambios de API. Las reglas Paper usan `@scope` (de `data-ds-style="paper"` hasta un `data-ds-style="studio"` anidado), así que un subárbol Studio dentro de Paper conserva su aspecto.
