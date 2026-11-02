# Text

## Propósito

Aplicar los roles tipográficos del sistema y sus tonos semánticos a cualquier elemento textual.

## API

| Prop | Tipo | Predeterminado | Descripción |
| --- | --- | --- | --- |
| `variant` | `TextVariant` | `body` | Rol tipográfico entre los 17 roles del sistema. |
| `as` | Elemento HTML textual | `p` | Elemento semántico que se renderiza. |
| `tone` | `default \| muted \| inverse` | `default` | Color semántico del texto. |
| `children` | `ReactNode` | — | Contenido que se muestra. |
| `className` | `string` | — | Clase adicional opcional. |
| `ref` y props nativas | Según `p` | — | Props HTML aplicables al elemento. |

## Variantes y estados

Roles: `display`, `heading`, `subheading-serif`, `subheading-sans`, `title`, `body`, `body-lg`, `body-strong`, `body-sm`, `ui`, `ui-medium`, `ui-strong`, `ui-sm`, `caption`, `caption-medium`, `label` y `code`. Tonos: `default`, `muted` e `inverse`.

## Accesibilidad

El elemento se elige con `as` para conservar la jerarquía semántica. El componente no introduce contenido ni nombres accesibles propios. Verifica contraste suficiente al usar el tono inverso sobre una superficie inversa.

## Cuándo usarlo y cuándo no

Úsalo para texto que debe adoptar un rol tipográfico del sistema. No lo uses para controles interactivos ni para reemplazar elementos semánticos con una jerarquía incorrecta.
