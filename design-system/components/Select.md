# Select

## Propósito
Selector nativo de una opción con indicador visual de despliegue.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| Props nativas | `ComponentProps<"select">` | — | Atributos HTML; incluir opciones como hijos. |

## Variantes y estados
Normal, inválido con `aria-invalid="true"` y deshabilitado con `disabled`.

## Accesibilidad
Es un elemento `select` nativo, operable por teclado. El chevron es decorativo y se oculta
a tecnologías de asistencia; mantener etiqueta y mensaje textual de error.

## Cuándo usarlo y cuándo no
Usar para elegir entre opciones predefinidas. No usar si la lista necesita búsqueda o
selección múltiple compleja.
