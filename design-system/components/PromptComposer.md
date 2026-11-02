# PromptComposer

## Propósito
Formulario controlado para redactar una solicitud y configurar opciones de salida.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `values` | `PromptComposerValues` | Requerido | Valores controlados del texto y las opciones. |
| `onChange` | `(values: PromptComposerValues) => void` | Requerido | Recibe el objeto completo al cambiar un campo. |
| `onSubmit` | `(values: PromptComposerValues) => void` | Requerido | Recibe los valores al enviar el formulario. |
| `labels` | `PromptComposerLabels` | Requerido | Etiquetas, mensajes y nombres de las opciones de idioma. |
| `themeOptions` | `Array<{ value: string; label: string }>` | Requerido | Temas disponibles. |
| `status` | `"idle" \| "submitting"` | `"idle"` | Estado de envío. |
| `error` | `{ message; action?; reference? }` | — | Error de envío con `ErrorMessage` pequeño: mensaje, acción de reintento y referencia opcional. |
| `warnAt` | `number` | `30000` | Umbral de caracteres para mostrar el aviso. |
| Props nativas | `ComponentProps<"form">` sin `onSubmit`, `onChange` ni `children` | — | Atributos nativos del formulario. |

`OutputLanguage` admite `"original"`, `"es"` y `"en"`. `PromptComposerValues`
contiene `text`, `title`, `sourceUrl`, `theme` y `outputLanguage`. `PromptComposerLabels`
contiene todas las etiquetas y funciones de contador y aviso necesarias para la interfaz.

## Variantes y estados
El formulario es controlado: el padre proporciona `values` y actualiza el objeto
recibido en `onChange`. Las opciones adicionales están en un elemento `details`
nativo cerrado por defecto. El aviso aparece al superar `warnAt`, sin impedir el envío.
El único botón de envío se deshabilita si el texto está vacío o el estado es `submitting`;
en este último estado muestra el indicador y el texto proporcionado.

## Accesibilidad
Los controles usan `Field` con etiquetas asociadas; el contador se anuncia con
`aria-live="polite"` y el error en una región `aria-live="polite"`. Las opciones usan disclosure
nativo. El botón refleja los estados de envío y texto vacío mediante `disabled`.

## Cuándo usarlo y cuándo no
Úsalo para recoger texto de entrada y opciones relacionadas en un único envío.
No lo uses para formularios con campos o flujos que requieran otra composición.
