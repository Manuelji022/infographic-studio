# Note

## Propósito
Feedback contextual en línea junto al campo, tarjeta o sección que describe, con el enfoque del componente
Note de Geist adaptado a nuestra paleta. Sustituye a `Callout`.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `children` | `ReactNode` | Requerido | Mensaje: una frase en voz activa que nombre el impacto. |
| `variant` | `"default" \| "secondary" \| "success" \| "warning" \| "error"` | `"default"` | Significado. |
| `appearance` | `"outline" \| "fill"` | `"outline"` | `fill` tiñe el fondo con el color de la variante. |
| `size` | `"default" \| "small"` | `"default"` | Tamaño y relleno interior. |
| `icon` | `IconName \| null` | icono de la variante | Sustituye el icono; `null` no muestra icono. |
| `label` | `string` | — | Prefijo corto en negrita (1–2 palabras). |
| `action` | `ReactNode` | — | Una única llamada a la acción en línea (por ejemplo un `Button` pequeño). |
| Props de `div` | Nativas | — | Atributos estándar (por ejemplo `role="alert"`). |

## Variantes y estados
- `default`: borde `--ds-border-strong`, icono de información.
- `secondary`: neutra y atenuada.
- `success`: borde e icono en oliva (`--ds-data-4`).
- `warning`: borde e icono en ocre (`--ds-data-3`).
- `error`: borde `--ds-danger`; icono y texto `--ds-danger-text`.
Solo el texto de `error` va en color; el resto usa `--ds-text` para mantener AA.

## Accesibilidad
El significado se transmite también con el icono, nunca solo con el color. No tiene rol por defecto (es
contenido estático); usa `role="alert"` solo si aparece de forma asíncrona. Persiste hasta que cambia el
estado: no añadas un botón de cierre ad hoc.

## Cuándo usarlo y cuándo no
Una Note por concepto; no apiles varias en una tarjeta ni añadas un segundo botón junto a la acción. Para
errores de sección o de ruta usa `ErrorMessage`; para validación de campo, el `error` de `Field`.
