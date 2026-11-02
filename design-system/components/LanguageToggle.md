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
El control es un único botón fantasma con un globo y el código del idioma activo (`label`).

- **Dos opciones:** al pulsarlo cambia directamente al otro idioma.
- **Tres o más opciones:** muestra un chevrón y abre un menú nativo (`popover`) con el nombre de
  cada idioma; el activo lleva una marca de verificación. Elegir el idioma activo no invoca
  `onChange` y cierra el menú.

## Accesibilidad
El botón es nativo y su nombre accesible es `label` seguido del idioma: con dos opciones, el
idioma al que cambiará (por ejemplo, «Cambiar idioma: English»); con menú, el idioma activo. En el
menú, la opción activa se expone con `aria-current`. Escape cierra el menú. Foco visible y área
táctil mínima de 44 px.

## Cuándo usarlo y cuándo no
Úsalo para elegir entre idiomas disponibles. No lo uses para navegación entre páginas ni para
selecciones de muchas opciones.
