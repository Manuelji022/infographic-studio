# Icon

## Propósito

Representa visualmente una acción o concepto mediante un SVG lineal compacto.

## API

| Prop | Tipo | Predeterminado | Descripción |
| --- | --- | --- | --- |
| `name` | `IconName` | — | Nombre del icono: `chevron-down`, `chevron-right`, `arrow-right`, `close`, `check`, `copy`, `share`, `trash`, `search`, `user`, `alert`, `link`, `info`, `success` o `warning`. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Tamaño de 16, 20 o 24 px. |
| `title` | `string` | — | Nombre accesible; sin título el SVG queda oculto a tecnologías asistivas. |
| Props SVG | Props nativas | — | Atributos estándar del elemento SVG raíz. |

## Variantes y estados

Los tamaños son `sm`, `md` y `lg`. Cada uno de los ocho nombres tiene un trazado propio. No tiene estados interactivos.

## Accesibilidad

Con `title`, expone `role="img"` y asocia el título con `aria-labelledby`. Sin título usa `aria-hidden` y no recibe foco. Si comunica información necesaria, proporciona un título accesible.

## Cuándo usarlo y cuándo no

Úsalo junto a texto o con un nombre accesible cuando sea informativo. No lo uses como sustituto de texto esencial sin etiqueta accesible.
