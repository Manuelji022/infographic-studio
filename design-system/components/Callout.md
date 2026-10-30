# Callout

## Propósito
Componente reutilizable de superficies y feedback.

## API
| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| variant | `"note" \| "highlight" \| "danger"` | `"note"` | Variante visual. `danger` muestra un icono de alerta y el mensaje en rojo (`--ds-danger-text`), sin fondo ni borde, como el componente de error de Geist. Úsalo con `role="alert"`. |
| children | ReactNode | — | Contenido accesible. |

## Variantes y estados
Consultar variantes tipadas del componente.

## Accesibilidad
Semántica nativa; el foco visible se conserva en elementos interactivos.

## Cuándo usarlo y cuándo no
Usar para organizar contenido; no añadir textos propios.
