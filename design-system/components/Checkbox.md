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

## Estilo Paper
Con `data-ds-style="paper"`: casilla de 20 px, radio `--ds-paper-radius-sm`, borde de 1 px en `text-muted` (hover: `text`), marcada con `surface-inverse` (hover: `surface-inverse-hover`) y marca `text-inverse`. Deshabilitado: fondo `control` sobre `surface`, borde `border-strong` y etiqueta `text-disabled`. Separación casilla-etiqueta de 12 px. Foco con el anillo habitual. Las reglas Paper usan `@scope` (de `data-ds-style="paper"` hasta un `data-ds-style="studio"` anidado), así que un subárbol Studio dentro de Paper conserva su aspecto.
