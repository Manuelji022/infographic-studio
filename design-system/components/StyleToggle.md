# StyleToggle

## Propósito
Permite elegir el estilo visual de la aplicación (por ejemplo, Studio o Paper) entre opciones
proporcionadas.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `value` | `string` | Requerido | Valor seleccionado. |
| `options` | `StyleToggleOption[]` | Requerido | Opciones con `value`, `label` y `ariaLabel` |
|  |  |  | opcional. |
| `onChange` | `(value: string) => void` | Requerido | Recibe el valor al cambiar la selección. |
| `label` | `string` | Requerido | Nombre accesible del grupo. |
| Props nativas | `ComponentProps<"div">` sin `onChange` | — | Atributos nativos del contenedor. |

## Variantes y estados
Grupo de botones segmentados, uno por opción. La opción activa se muestra rellena con
`surface-inverse`; las demás son fantasma y se resaltan con `surface-deep` al pasar el cursor.
Elegir la opción activa no invoca `onChange`. El componente no contiene texto propio: las
etiquetas llegan por props.

## Accesibilidad
Contenedor con `role="group"` y `aria-label` igual a `label`. Cada opción es un botón nativo con
`aria-pressed` y, si se indica, `aria-label` igual a `ariaLabel`. Foco visible y altura total de 44 px (botones de 36 px con área táctil ampliada a 44 px),
por opción, igual que `LanguageToggle`.

## Cuándo usarlo y cuándo no
Úsalo para cambiar entre estilos visuales globales. No lo uses para idioma (usa `LanguageToggle`),
para el tema claro/oscuro ni para navegación.

## Estilo Paper
Con `data-ds-style="paper"` sigue el aspecto de control segmentado: contenedor con borde `border`, radio de 8 px y 3 px de relleno; cada opción tiene radio de 6 px, texto `ui` de 15 px sin negrita y fondo `control-hover` al pasar el cursor. La opción activa sigue rellena con `surface-inverse`. El grupo mide 44 px en total, como en Studio.
