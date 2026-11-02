# Revisión visual de `line.html`

Capturas revisadas a 360 px y 1280 px, en claro y oscuro. Las etiquetas de inicio y fin se
mantienen en pastillas fuera de los trazos; en inflación, «-0,5 %» queda fuera de la subida de
2015–2017 y «Inflación 2,0 %» queda libre del tramo previsto 2025–2026 en las cuatro vistas.
El fixture `line.peak-end` coloca su valor final por encima del ascenso brusco, sin cubrir el trazo.
Los casos de varios finales conservan separación vertical; huecos y puntos únicos no añaden
etiquetas sobre segmentos inexistentes.

| Fixture | Observación en las capturas |
| --- | --- |
| `line.dense` (es/en) | Etiquetas finales escalonadas; los trazos permanecen visibles. |
| `line` inflación (es/en) | «-0,5 %» no cubre la subida inicial. |
|  | «Inflación 2,0 %» no cubre la previsión discontinua. |
| `line.gaps` (es/en) | Etiquetas fuera de los trazos; huecos conservados. |
| `line.negative` (es/en) | Etiquetas fuera de los tramos ascendentes y descendentes. |
| `line.peak-end` (es/en) | El ascenso brusco final queda visible junto a su etiqueta. |
| `line.projected` (es/en) | Etiquetas separadas del tramo previsto discontinuo. |
| `line.single-point` (es/en) | Se muestra el valor del punto sin etiqueta inicial duplicada. |

El layout-check informa cero incidencias en 360/1280 px y en ambos temas.
