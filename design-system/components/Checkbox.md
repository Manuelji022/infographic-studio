# Checkbox

## Propósito
Opción nativa seleccionable acompañada por su etiqueta visible.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| Props de input | `ComponentProps<"input">` sin `type` | — | Atributos nativos; `type` siempre es checkbox. |
| `children` | `ReactNode` | requerido | Nombre visible asociado al control. |

## Variantes y estados
Sin variante de estilo; estados normal, marcado (`checked`) y deshabilitado (`disabled`).

## Accesibilidad
Input nativo dentro de una etiqueta; conserva teclado, foco visible y estado marcado
programáticamente disponible.

## Cuándo usarlo y cuándo no
Usar para opciones independientes o selección múltiple. Para una elección excluyente, usar
controles de radio.
