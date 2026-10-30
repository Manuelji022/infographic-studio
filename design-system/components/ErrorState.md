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
| `detail` | `string` | — | ID estable del error (request/trace ID), en un `<details>` plegado. |
| `detailLabel` | `string` | — | Texto del resumen del `<details>`; sin él no se muestra el detalle. |
| `autoFocusRetry` | `boolean` | `false` | Mueve el foco al botón de reintento (errores de ruta completa). |
| Props nativas | `ComponentProps<"div">` sin `title` | — | Atributos nativos del contenedor. |

## Variantes y estados
La descripción y el detalle técnico son opcionales; el reintento siempre está disponible.

## Accesibilidad
Se apoya en `ErrorMessage` (tamaño grande, `aria-live="assertive"`). El botón expone la etiqueta
recibida por propiedad y puede recibir el foco al aparecer.

## Cuándo usarlo y cuándo no
Úsalo para errores recuperables dentro de una vista. No lo uses para errores
que requieran navegación o confirmación modal.
