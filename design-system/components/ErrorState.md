# ErrorState

## Propósito
Comunica un error recuperable y ofrece reintentar la operación.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `title` | `string` | Requerido | Título del error. |
| `description` | `string` | — | Explicación complementaria. |
| `retryLabel` | `string` | Requerido | Etiqueta del botón de reintento. |
| `onRetry` | `() => void` | Requerido | Acción al solicitar el reintento. |
| `detail` | `string` | — | Detalle técnico opcional. |
| Props nativas | `ComponentProps<"div">` sin `title` | — | Atributos nativos del contenedor. |

## Variantes y estados
La descripción y el detalle técnico son opcionales; el reintento siempre está disponible.

## Accesibilidad
El contenedor usa `role="alert"` y el botón expone la etiqueta recibida
por propiedad.

## Cuándo usarlo y cuándo no
Úsalo para errores recuperables dentro de una vista. No lo uses para errores
que requieran navegación o confirmación modal.
