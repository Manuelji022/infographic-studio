# ig-chart

## Proposito
Reservar un hueco para un gráfico de la librería, identificado por un spec de `charts`.
El contenido lo genera `renderChart` a partir de ese spec al expandir la infografía.

## Marcado canonico
```html
<div class="ig-chart" data-chart="c1"></div>
```

## Variantes y estados
No tiene variantes en el fragmento. Las clases `ig-chart__*` pertenecen al render y se rechazan
si las escribe el agente.

## Datos
`data-chart` referencia el `id` de un spec de `charts`: `^[a-z][a-z0-9-]{0,31}$`.
El mismo id puede aparecer varias veces; `chartReferences` conserva su orden y repeticiones.
Solo se admite en un `div` cuya clase sea exactamente `ig-chart`.

## Reglas
El hueco está vacío: sin texto, espacios, comentarios ni hijos. No acepta atributos adicionales,
ni siquiera `style` o `aria-*`, ni clases combinadas o atributos duplicados.
La forma canónica es estricta: primero `class`, luego `data-chart`, un espacio entre atributos,
minúsculas, comillas dobles y cierre inmediato `</div>`. No se normaliza la entrada.
Se rechazan entidades en el id, comillas simples, orden invertido y nombres en mayúsculas.

## Accesibilidad
`renderChart` genera el título, la descripción y la tabla accesible del gráfico.
El agente no añade atributos de accesibilidad al hueco.

## Cuando usarlo y cuando no
Úsalo para insertar un gráfico definido en `charts`, dentro de `ig-section` cuando corresponda.
Para una cifra de texto sin gráfico usa `ig-stat`.
