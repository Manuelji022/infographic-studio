# AppHeader

## Propósito
Presenta la marca, la navegación principal y las acciones globales de la aplicación.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `brand` | `ReactNode` | Requerido | Marca situada al inicio del encabezado. |
| `navLabel` | `string` | Requerido | Nombre accesible de la navegación. |
| `items` | `AppHeaderNavItem[]` | Requerido | Enlaces; se omite la navegación si está vacío. |
| `actions` | `ReactNode` | — | Acciones situadas al final del encabezado. |
| Props nativas | Atributos de `header` excepto `children` | — | Atributos HTML del encabezado. |

Cada elemento de navegación contiene `key`, `label`, `href` y `current?`.

## Variantes y estados
Los enlaces actuales mantienen el subrayado y declaran `aria-current="page"`.
La navegación se ajusta en varias filas en pantallas estrechas.

## Accesibilidad
`navLabel` nombra el elemento `nav`; los enlaces conservan foco visible y altura mínima
para interacción táctil. El contenido de marca y acciones se proporciona desde fuera.

## Cuándo usarlo y cuándo no
Úsalo como encabezado global de la aplicación. No lo uses para encabezados de sección
ni incluyas lógica de sesión o navegación dentro del componente.

## Estilo Paper
No requiere reglas propias: la cabecera usa `canvas`, `border` y la escala tipográfica de Paper (Geist, `ui-sm` de 13 px para enlaces, `ui-strong` de 15 px para la marca) a través de los tokens. Los enlaces conservan 44 px de alto y el subrayado de 2 px para la página actual y el hover. Los controles de la zona de acciones (`LanguageToggle`, `StyleToggle`, `UserMenu`) aplican su propio estilo Paper.
