# Textarea

## Propósito
Control nativo multilínea para texto extenso.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| Props nativas | `ComponentProps<"textarea">` | — | Atributos nativos excepto `rows`. |
| `rows` | `number` | `4` | Número inicial de líneas. |
| `resize` | `"none" \| "vertical"` | `"vertical"` | Permite o bloquea el redimensionado vertical. |

## Variantes y estados
Normal, inválido con `aria-invalid="true"` y deshabilitado con `disabled`.

## Accesibilidad
Asociar etiqueta y mensaje de error; conserva la interacción nativa y foco visible.

## Cuándo usarlo y cuándo no
Usar para entradas extensas. Para una sola línea, usar `Input`.

## Estilo Paper
Con `data-ds-style="paper"`: altura mínima 96 px, relleno 12 px, radio `--ds-paper-radius-md`, relleno horizontal 12 px, texto `ui-sm`, fondo `surface` y borde `border-strong` de 1 px. Hover oscurece el borde (`text-subtle`) salvo en foco o inválido, que conservan su borde; el foco usa borde `focus-ring` más un anillo de 1 px (2 px visibles); inválido usa `danger` con el mismo grosor; deshabilitado usa `control` sobre `surface` y `text-disabled`. Sin cambios de API. Las reglas Paper usan `@scope` (de `data-ds-style="paper"` hasta un `data-ds-style="studio"` anidado), así que un subárbol Studio dentro de Paper conserva su aspecto.
