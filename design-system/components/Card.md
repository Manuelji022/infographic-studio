# Card

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

Radio `--ds-paper-radius-5xl` y relleno 32px (sección "Code today" del marco). Las variantes surface/feature/deep/inverse se asignan por los roles `surface`, `surface-feature`, `surface-deep` y `surface-inverse`, sin cambios de CSS. Las reglas Paper usan `@scope` (de `data-ds-style="paper"` hasta un `data-ds-style="studio"` anidado), así que un subárbol Studio dentro de Paper conserva su aspecto.
