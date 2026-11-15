# Label

## Propósito
Etiqueta accesible asociada a un control mediante `htmlFor`.

## API

| Propiedad | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| Props nativas | `ComponentProps<"label">` | — | Atributos, contenido y asociación HTML. |

## Variantes y estados
Sin variantes visuales; admite clases adicionales.

## Accesibilidad
Usar `htmlFor` con el `id` del control. Mantiene el comportamiento nativo de etiqueta.

## Cuándo usarlo y cuándo no
Usar para nombrar controles. No usar texto sin asociación semántica a un control.

## Estilo Paper

Sin reglas propias: la etiqueta usa el rol `ui-medium` (15/24, 500) y `--ds-text`, que Paper ya resuelve con sus tokens.
