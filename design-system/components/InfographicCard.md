# InfographicCard

## Propósito
Presenta una infografía dentro de una biblioteca con miniatura, metadatos y enlace.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `title` | `string` | Requerido | Título enlazado de la tarjeta. |
| `href` | `string` | Requerido | Destino del enlace principal. |
| `summary` | `string` | — | Resumen limitado visualmente a tres líneas. |
| `tags` | `string[]` | `[]` | Etiquetas; se muestran hasta tres y un contador adicional. |
| `date` | `string` | Requerido | Fecha ya formateada. |
| `languages` | Array de objetos `code`/`label` | Requerido | Idiomas disponibles. |
| `sharedLabel` | `string` | — | Indicador textual de contenido compartido. |
| `thumbnail` | `ReactNode` | — | Contenido de miniatura. |
| `moreTagsLabel` | `string` | — | Texto para acompañar el número de etiquetas restantes. |
| Props nativas | Props de `article`, excepto `title` | — | Atributos nativos del artículo. |

## Variantes y estados
La tarjeta usa la superficie estándar. La caja de miniatura mantiene relación 16:10 incluso
vacía; el resumen queda limitado a tres líneas.

## Accesibilidad
El enlace conserva subrayado y foco visible en la tarjeta. Los metadatos se presentan como texto;
`title` nombra el destino enlazado.

## Cuándo usarlo y cuándo no
Úsalo para un elemento de una biblioteca de infografías. No lo uses para acciones independientes
o contenido que no tenga un destino principal.
