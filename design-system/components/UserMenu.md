# UserMenu

## Propósito
Presenta la identidad de sesión y acciones relacionadas en un popover nativo.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `name` | `string` | Requerido | Nombre de la persona. |
| `email` | `string` | — | Dirección de correo opcional. |
| `triggerLabel` | `string` | Requerido | Nombre accesible del botón disparador. |
| `items` | `UserMenuItem[]` | Requerido | Acciones con `key`, `label` y `href` o `onSelect`. |
| Props nativas | `ComponentProps<"div">` sin `children` | — | Atributos nativos del contenedor. |

## Variantes y estados
Los elementos con `href` se representan como enlaces y aquellos con `onSelect` como botones.
Al ejecutar una acción de botón se invoca `onSelect` y se cierra el popover.

## Accesibilidad
El botón tiene nombre mediante `triggerLabel`; el nombre visual se oculta en pantallas pequeñas
sin afectar ese nombre accesible. El popover nativo proporciona interacción de teclado, Escape y
cierre al hacer clic fuera. Los controles ofrecen foco visible.

## Cuándo usarlo y cuándo no
Úsalo para acciones vinculadas a la sesión actual. No lo uses como menú principal de navegación.
