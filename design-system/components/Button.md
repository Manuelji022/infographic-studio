# Button

## Propósito

Acción nativa de formulario con variantes visuales y tamaños consistentes.

## API

| Prop | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| variant | `"accent" \| "ivory" \| "outline" \| "ghost"` | `"ivory"` | Estilo visual. |
| size | `"md" \| "sm"` | `"md"` | Tamaño de controles y padding. |
| tone | `"default" \| "inverse"` | `"default"` | `inverse` da contraste a outline y ghost en fondos oscuros. |
| type | `"button" \| "submit" \| "reset"` | `"button"` | Tipo nativo del botón. |
| disabled | `boolean` | `false` | Desactiva la interacción según el atributo HTML nativo. |
| children | `ReactNode` | — | Contenido visible suministrado por quien usa el componente. |
| ...props | `ComponentProps<"button">` | — | Resto de propiedades y eventos nativos de button. |

## Variantes y estados

Incluye las variantes accent, ivory, outline y ghost; tamaños md y sm; estado deshabilitado nativo.

## Accesibilidad

Se conserva el elemento `button` nativo, su semántica y teclado. El foco tiene
anillo visible; el estado deshabilitado usa `disabled` y cambia visualmente.

## Cuándo usarlo y cuándo no

Úsalo para ejecutar acciones. Reserva accent a una única acción principal.
Usa `tone="inverse"` en outline y ghost sobre superficies oscuras. Para
navegación usa un enlace, no un botón.
