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
| `status` | `"idle" \| "creating" \| "saving" \| "revoking"` | `"idle"` | Estado de la operación. `saving` deshabilita acciones y selectores mientras se guarda un cambio en un enlace existente. |
| `error` | `string \| null` | `null` | Error de la última operación, ya localizado por quien usa el componente. Se muestra en línea con `role="alert"`. |
| `onNativeShare` | `() => void` | — | Si se pasa y hay enlace, muestra el botón de compartir nativo (`labels.nativeShare`). Quien usa el componente comprueba `navigator.share`. |

Las etiquetas opcionales `copyFailed`, `nativeShare` y `saving` completan la API; sin `copyFailed`, un fallo al copiar no muestra mensaje.

## Variantes y estados
Sin enlace ofrece creación; con enlace permite copiarlo o revocarlo. Los estados de
operación deshabilitan acciones.

## Accesibilidad
Los campos tienen etiquetas. Copiar anuncia el éxito mediante una región de estado y un fallo mediante `role="alert"`. Los errores se muestran dentro del diálogo, nunca en un diálogo apilado.

## Cuándo usarlo y cuándo no
Úsalo para gestionar enlaces compartidos. No lo uses como diálogo de confirmación destructiva.
