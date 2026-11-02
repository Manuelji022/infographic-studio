# EmptyState

## Propósito
Explica una vista sin contenido y permite ofrecer una acción contextual.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `title` | `string` | Requerido | Título del estado vacío. |
| `description` | `string` | — | Descripción complementaria. |
| `action` | `ReactNode` | — | Acción proporcionada por quien consume el componente. |
| `icon` | `IconName` | — | Icono opcional. |
| Props nativas | `ComponentProps<"div">` sin `title` | — | Atributos nativos del contenedor. |

## Variantes y estados
El icono, la descripción y la acción son opcionales.

## Accesibilidad
El título identifica el mensaje; las acciones y sus etiquetas accesibles
corresponden al consumidor.

## Cuándo usarlo y cuándo no
Úsalo cuando una sección no tenga contenido que mostrar. No lo uses para comunicar errores.
