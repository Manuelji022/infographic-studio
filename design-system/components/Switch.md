# Switch

## Propósito
Permite activar o desactivar una opción binaria con una etiqueta visible.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `children` | `ReactNode` | Requerido | Etiqueta visible del control. |
| `checked` | `boolean` | `false` | Estado controlado del interruptor. |
| `defaultChecked` | `boolean` | — | Estado inicial no controlado. |
| `disabled` | `boolean` | `false` | Deshabilita la interacción. |
| Props nativas | `ComponentProps<"input">` sin `type` | — | Atributos y eventos de input; `type` siempre es checkbox. |

## Variantes y estados
Estado apagado, encendido (`checked`) y deshabilitado. Admite el estado de error
accesible mediante los atributos del contexto Field.

## Accesibilidad
Usa un input nativo checkbox con `role="switch"`; conserva navegación y cambio
con teclado nativos, y muestra foco visible. La etiqueta se asocia al control.

## Cuándo usarlo y cuándo no
Úsalo para opciones binarias de efecto inmediato. No lo uses para seleccionar
entre varias alternativas ni para acciones que requieren confirmación explícita.
