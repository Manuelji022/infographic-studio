# GenerationProgress

## Propósito
Muestra el avance de una generación como una lista ordenada de pasos.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `steps` | `GenerationStep[]` | Requerido | Pasos con clave, etiqueta, estado |
|  |  |  | y etiqueta accesible. |
| `label` | `string` | Requerido | Nombre accesible de la lista. |
| Props nativas | `ComponentProps<"ol">` sin `children` | — | Atributos nativos de la lista. |

## Variantes y estados
Los estados son `pending`, `active`, `done` y `error`; cada uno tiene
marcador y tratamiento textual propios.

## Accesibilidad
El paso activo usa `aria-current="step"`. Los estados se anuncian mediante
texto; el spinner anuncia el estado activo y los demás pasos usan texto solo
para lectores de pantalla.

## Cuándo usarlo y cuándo no
Úsalo para procesos secuenciales de generación. No lo uses para progreso
indeterminado sin pasos definidos.
