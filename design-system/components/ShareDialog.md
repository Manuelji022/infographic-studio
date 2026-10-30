# ShareDialog

## Propósito
Permite crear, copiar y revocar un enlace compartido y ajustar sus opciones.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `open` | `boolean` | Requerido | Controla la visibilidad modal. |
| `onClose` | `() => void` | Requerido | Solicita cerrar el diálogo. |
| `labels` | `ShareDialogLabels` | Requerido | Textos y opciones localizados. |
| `url` | `string \| null` | Requerido | Enlace actual o ausencia de enlace. |
| `expiry` | `ShareExpiry` | Requerido | Caducidad seleccionada. |
| `onExpiryChange` | `(e: ShareExpiry) => void` | Requerido | Cambia la caducidad. |
| `language` | `string` | Requerido | Idioma seleccionado. |
| `onLanguageChange` | `(l: string) => void` | Requerido | Cambia el idioma. |
| `onCreate` | `() => void` | Requerido | Crea el enlace. |
| `onRevoke` | `() => void` | Requerido | Revoca el enlace. |
| `status` | `"idle" \| "creating" \| "revoking"` | `"idle"` | Estado de la operación. |

## Variantes y estados
Sin enlace ofrece creación; con enlace permite copiarlo o revocarlo. Los estados de
operación deshabilitan acciones.

## Accesibilidad
Los campos tienen etiquetas y copiar anuncia el éxito mediante una región de estado.

## Cuándo usarlo y cuándo no
Úsalo para gestionar enlaces compartidos. No lo uses como diálogo de confirmación destructiva.
