# Skeleton

## Propósito
Componente reutilizable de superficies y feedback.

## API
| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| variant | string | — | Variante visual. |
| children | ReactNode | — | Contenido accesible. |

## Variantes y estados
Consultar variantes tipadas del componente.

## Accesibilidad
Semántica nativa; el foco visible se conserva en elementos interactivos.

## Cuándo usarlo y cuándo no
Usar para organizar contenido; no añadir textos propios.

## Estilo Paper

En Paper el fondo es `--ds-control`; Studio mantiene `--ds-surface-deep`. Radio `--ds-paper-radius-sm` en `text` y `--ds-paper-radius-lg` en `block`; `circle` sigue al 50%. Las reglas Paper usan `@scope` (de `data-ds-style="paper"` hasta un `data-ds-style="studio"` anidado), así que un subárbol Studio dentro de Paper conserva su aspecto.
