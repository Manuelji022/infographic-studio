# Field

## Propósito
Agrupa una etiqueta, un control y su descripción o error accesible.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `label` | `ReactNode` | requerido | Contenido de la etiqueta asociada. |
| `description` | `ReactNode` | — | Ayuda vinculada con `aria-describedby`. |
| `error` | `ReactNode` | — | Mensaje de error anunciado con `role="alert"`. |
| `children` | `ReactNode` | requerido | Control del campo. |
| `id` | `string` | generado | Identificador del control; se genera con `useId`. |

## Variantes y estados
Incluye presentación normal, descripción y error. `useFieldControl()` dentro del campo
retorna `{ id, "aria-describedby", "aria-invalid" }`; fuera de un `Field` retorna `{}`.
Los atributos explícitos del control prevalecen sobre los valores heredados.

## Accesibilidad
La etiqueta usa `htmlFor`; descripción y error se enlazan por ID. El error tiene alerta
accesible, icono informativo y texto visible; no depende solo del color.

## Cuándo usarlo y cuándo no
Usar para controles con etiqueta o mensaje contextual. No anidar campos ni usarlo para
contenido que no sea un formulario.
