# LanguageToggle

## Propósito
Permite seleccionar una opción de idioma entre opciones proporcionadas.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `value` | `string` | Requerido | Valor seleccionado. |
| `options` | `LanguageToggleOption[]` | Requerido | Opciones con `value`, `label` y `ariaLabel` |
|  |  |  | opcional. |
| `onChange` | `(value: string) => void` | Requerido | Recibe el valor al cambiar la selección. |
| `label` | `string` | Requerido | Nombre accesible del grupo. |
| Props nativas | `ComponentProps<"div">` sin `onChange` | — | Atributos nativos del contenedor. |

## Variantes y estados
El control presenta una fila de opciones. La opción activa se indica con `aria-pressed`; activar
la opción ya seleccionada no invoca `onChange`.

## Accesibilidad
El grupo tiene nombre mediante `label`, cada control es un botón nativo y la opción activa se
expone mediante `aria-pressed`. Los botones admiten foco visible y área táctil mínima de 44 px.

## Cuándo usarlo y cuándo no
Úsalo para elegir entre idiomas disponibles. No lo uses para navegación entre páginas ni para
selecciones de muchas opciones.
