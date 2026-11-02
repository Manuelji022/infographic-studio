# ConfirmDialog

## Propósito
Solicita confirmación antes de completar una acción destructiva.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `open` | `boolean` | Requerido | Controla la visibilidad modal. |
| `onClose` | `() => void` | Requerido | Solicita cerrar el diálogo. |
| `onConfirm` | `() => void` | Requerido | Confirma la acción. |
| `title` | `string` | Requerido | Título accesible. |
| `description` | `ReactNode` | Requerido | Explicación de la acción. |
| `confirmLabel` | `string` | Requerido | Etiqueta de confirmar. |
| `cancelLabel` | `string` | Requerido | Etiqueta de cancelar. |
| `status` | `"idle" \| "pending"` | `"idle"` | Estado de la confirmación. |
| `spinnerLabel` | `string` | `confirmLabel` | Anuncio accesible de espera. |

## Variantes y estados
En estado pendiente ambas acciones se deshabilitan y confirmar muestra un indicador.

## Accesibilidad
El diálogo aporta semántica modal y el indicador recibe una etiqueta accesible.

## Cuándo usarlo y cuándo no
Úsalo para confirmar acciones destructivas. No lo uses para decisiones no destructivas.
