# FilterBar

## Propósito
Permite combinar filtros controlados de la biblioteca.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `values` | `FilterBarValues` | Requerido | Valores actuales de los filtros. |
| `onChange` | `(values: FilterBarValues) => void` | Requerido | Notifica cambios sin mantener estado interno. |
| `labels` | `FilterBarLabels` | Requerido | Etiquetas visibles, incluida la acción para limpiar. |
| `tagOptions` | `FilterBarOption[]` | Requerido | Opciones de etiqueta, incluida la opción vacía inicial. |
| `dateOptions` | `FilterBarOption[]` | Requerido | Opciones de fecha, incluida la opción vacía inicial. |
| `languageOptions` | `FilterBarOption[]` | Requerido | Opciones de idioma, incluida la opción vacía inicial. |
| `label` | `string` | Requerido | Nombre accesible del grupo. |
| Props nativas | `ComponentProps<"div">` sin `onChange` | — | Atributos del contenedor. |

## Variantes y estados
El componente es controlado: las selecciones notifican el siguiente objeto al padre.
El botón de limpieza aparece únicamente cuando hay algún filtro activo y restablece
los cuatro valores. Una cadena vacía representa todos los valores de cada selector.

## Accesibilidad
El contenedor expone un grupo con nombre mediante `label`. Cada selector se asocia
con su etiqueta mediante `Field`; el interruptor tiene como nombre `sharedLabel`.

## Cuándo usarlo y cuándo no
Úsalo para filtros combinables en una biblioteca. No lo uses como formulario de
edición ni para filtros que requieren estado interno independiente.
