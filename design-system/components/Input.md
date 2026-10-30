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
