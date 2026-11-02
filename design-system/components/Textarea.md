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
