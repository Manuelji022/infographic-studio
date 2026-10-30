# SearchBar

## Propósito
Permite introducir y enviar una consulta de búsqueda controlada por el padre.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `value` | `string` | Requerido | Consulta actual. |
| `onChange` | `(value: string) => void` | Requerido | Recibe la consulta editada. |
| `onSubmit` | `(value: string) => void` | — | Recibe la consulta al enviar. |
| `label` | `string` | Requerido | Nombre accesible del campo. |
| `placeholder` | `string` | — | Texto de ejemplo del campo. |
| `clearLabel` | `string` | Requerido | Nombre accesible del botón de limpiar. |
| `submitLabel` | `string` | Requerido | Texto del botón de envío. |
| Props nativas | Props de `form` excepto callbacks | — | Atributos nativos del formulario. |

## Variantes y estados
El botón para limpiar aparece cuando hay una consulta. En pantallas de hasta 480 px el texto de
envío queda visualmente oculto y conserva su nombre accesible.

## Accesibilidad
El formulario tiene rol de búsqueda, el campo recibe `label` como nombre accesible y el botón de
limpieza recibe `clearLabel`. Al limpiar se devuelve el foco al campo.

## Cuándo usarlo y cuándo no
Úsalo para búsquedas controladas con una consulta de texto. No lo uses para formularios de filtros
o búsquedas que no tengan un envío explícito.
