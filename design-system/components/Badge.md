# Badge

## Propósito

Etiqueta breve para clasificar o destacar información complementaria.

## API

| Prop | Tipo | Predeterminado | Descripción |
| --- | --- | --- | --- |
| `variant` | `"neutral" \| "outlined" \| "solid"` | `"neutral"` | Presentación visual. |
| `children` | `ReactNode` | — | Contenido visible de la etiqueta. |
| Props de `span` | Nativas | — | Atributos estándar del elemento raíz. |

## Variantes y estados

`neutral` muestra solo texto; `outlined` añade borde; `solid` usa superficie profunda. No define estados interactivos.

## Accesibilidad

El elemento es un `span` sin semántica de control. El texto debe identificar la categoría sin depender solo del estilo visual; conserva contraste con `--ds-text`.

## Cuándo usarlo y cuándo no

Úsalo para metadatos compactos. No lo uses como botón ni para comunicar mensajes extensos.

## Estilo Paper

Radio `--ds-paper-radius-full` (píldora). En Paper la variante `solid` usa `--ds-control`; Studio mantiene `--ds-surface-deep`. Tipografía `caption-medium` y relleno 4/8 ya coincidían. Las reglas Paper usan `@scope` (de `data-ds-style="paper"` hasta un `data-ds-style="studio"` anidado), así que un subárbol Studio dentro de Paper conserva su aspecto.
