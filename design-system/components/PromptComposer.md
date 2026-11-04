# PromptComposer

## Propósito
Compositor de la pantalla Generar: un único contenedor con borde que reúne un textarea grande,
el selector de tipo de contenido, una URL de origen opcional, el contador de caracteres y el
único botón de acento. No lleva campos de título, tema ni idioma: el agente decide ambos.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `values` | `PromptComposerValues` | Requerido | `{ text, sourceUrl, contentType }`, controlados por el padre. |
| `onChange` | `(values) => void` | Requerido | Recibe el objeto completo al cambiar un campo. |
| `onSubmit` | `(values) => void` | Requerido | Se llama solo con texto no vacío y URL válida o vacía. `sourceUrl` llega recortada y vacía si se quitó. |
| `labels` | `PromptComposerLabels` | Requerido | Todos los textos (el componente no lleva copy): etiqueta y placeholder del texto, `counter(n)`, `warning(limit)`, selector, URL (`sourceUrlAdd`, `sourceUrlLabel`, `sourceUrlPlaceholder`, `sourceUrlInvalid`, `sourceUrlRemove`), `submit`, `submitting` y `shortcutHint` opcional. |
| `contentTypeOptions` | `Array<{ value; label; description }>` | Requerido | Tipos de contenido. La lista vive en el consumidor, así añadir un tipo no toca el componente. |
| `status` | `"idle" \| "submitting"` | `"idle"` | `submitting` bloquea el compositor y muestra el spinner en el botón. |
| `locked` | `boolean` | `false` | Solo lectura sin cambiar la etiqueta del botón (por ejemplo mientras se muestra el progreso). |
| `error` | `{ message; action?; reference? }` | — | `ErrorMessage` pequeño bajo el contenedor: mensaje, acción de reintento y referencia plegada. |
| `warnAt` | `number` | `30000` | Umbral del aviso suave; nunca bloquea el envío. |
| `autoFocus` | `boolean` | `false` | Enfoca el textarea al montar. |
| Props nativas | `ComponentProps<"form">` sin `onSubmit`, `onChange` ni `children` | — | Atributos nativos del formulario. |

Se exporta también `isValidSourceUrl(value)`: acepta solo URLs `http://` o `https://`.

## Variantes y estados
- **Vacío**: el botón Generar está deshabilitado.
- **Con texto**: botón activo, contador visible. `⌘/Ctrl + Enter` envía desde el textarea.
- **Texto muy largo**: `Note` de aviso bajo el contenedor al superar `warnAt`; no bloquea.
- **URL de origen**: la acción discreta «+ URL de origen» despliega un `Input`; un botón con
  icono lo quita. Se valida solo el formato (http/https) y el error aparece al salir del campo
  o al enviar.
- **Enviando / bloqueado**: textarea y controles en solo lectura, fondo atenuado.
- **Error**: `ErrorMessage` con acción de reintento; el texto se conserva siempre.

El textarea crece con el contenido (`field-sizing: content`, con mínimo y máximo de altura).

## Accesibilidad
El textarea tiene `aria-label` y el foco del contenedor se dibuja con el anillo de foco del
sistema. El contador se anuncia con `aria-live="polite"`; el error de URL con `role="alert"`.
El selector de tipo (`ContentTypeSelect`) es un listbox: `aria-haspopup`, `aria-expanded`,
`aria-activedescendant`; flechas, Inicio/Fin, Enter/Espacio y Escape. Todo es operable con teclado.

## Cuándo usarlo y cuándo no
Úsalo para la entrada principal de generación. Para un selector con descripciones en otro
contexto, usa `ContentTypeSelect` por separado; para opciones simples, `Select`.
