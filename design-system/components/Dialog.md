# Dialog

## Propósito
Presenta contenido modal que requiere atención temporal sin abandonar el contexto.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `open` | `boolean` | Requerido | Controla el estado modal desde el padre. |
| `onClose` | `() => void` | Requerido | Sincroniza el estado del padre al cerrarse. |
| `title` | `ReactNode` | Requerido | Título accesible del diálogo; es obligatorio. |
| `children` | `ReactNode` | Requerido | Contenido principal. |
| `footer` | `ReactNode` | — | Acciones alineadas al final. |
| Props nativas | `ComponentProps<"dialog">` sin `open` ni `onClose` | — | Atributos nativos. |

## Variantes y estados
El padre controla `open`; al pasar a verdadero se abre como modal y al pasar a
falso se cierra mediante el efecto. Escape dispara el evento nativo `cancel`;
el componente ejecuta `event.preventDefault()` y llama a `onClose` una sola vez.
El padre debe establecer `open=false` para que el efecto cierre el diálogo.

## Accesibilidad
El elemento nativo dialog ofrece semántica modal, confinamiento de foco y
restauración nativos. Un clic en el fondo llama a `onClose`; el diálogo no tiene
padding propio y el panel interior sí, por lo que los clics dentro del panel no
lo cierran. Un cierre nativo mientras `open` (por ejemplo, con un formulario
`method="dialog"`) también llama a `onClose`. `ref` es una prop normal reenviada
al elemento dialog. `title` es obligatorio y proporciona el nombre accesible
mediante `aria-labelledby`. No se intercepta Tab.

## Cuándo usarlo y cuándo no
Úsalo para una tarea o decisión que interrumpe el flujo. No lo uses para
contenido persistente, avisos breves ni paneles no modales.

## Estilo Paper
Con `data-ds-style="paper"` el panel usa `--ds-surface-overlay` (el diálogo
flota), borde `--ds-border`, radio 24px (`--ds-paper-radius-5xl`) y relleno
fijo de 32px. Título, pie (margen 24px, separación 12px) y fondo atenuado no
cambian. En Studio el aspecto es idéntico al anterior. Las reglas Paper usan `@scope` (de `data-ds-style="paper"` hasta un `data-ds-style="studio"` anidado), así que un subárbol Studio dentro de Paper conserva su aspecto.
