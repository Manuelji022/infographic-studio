# ErrorMessage

## Propósito
Mensaje de error de bloque (paneles, tarjetas, límites de ruta y fallos de envío), con el enfoque del
componente Error de Geist: icono de alerta y texto en rojo, sin fondo ni borde, y una recuperación concreta.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `children` | `ReactNode` | Requerido | Mensaje: qué pasó. |
| `label` | `string` | — | Prefijo en negrita, normalmente el recurso que falló. |
| `size` | `"small" \| "default" \| "large"` | `"default"` | Tamaño de texto. |
| `description` | `string` | — | Siguiente paso, en texto secundario. |
| `action` | `{ label: string; onClick: () => void }` | — | Acción de recuperación concreta («Reintentar»). |
| `link` | `{ label: string; href: string }` | — | Enlace de ayuda. |
| `reference` | `{ summary: string; id: string }` | — | ID estable de un error de sistema, en monoespaciada dentro de un `<details>` plegado. |
| `focusAction` | `boolean` | `false` | Mueve el foco a la acción al aparecer (errores de ruta completa). |
| `live` | `"polite" \| "assertive"` | `"polite"` | Región `aria-live`; `assertive` solo si bloquea la entrada. |

## Variantes y estados
Tres tamaños. Con o sin etiqueta, descripción, acción, enlace y referencia. Sin textos propios.

## Accesibilidad
Texto en `--ds-danger-text` (AA 4,5:1 sobre `canvas` y `surface` en ambos temas); el icono acompaña al color.
Región `aria-live` (polite por defecto). La referencia es un `<details>` nativo con foco visible.

## Cuándo usarlo y cuándo no
Úsalo para fallos de una sección o del envío de un formulario. Para validación de campo usa el `error` de
`Field`. Redacta qué pasó y el siguiente paso, sin «Oops» ni «Algo salió mal»; «No se pudo…» para el
usuario y «Error al…» para el sistema. No reintentes en segundo plano.
