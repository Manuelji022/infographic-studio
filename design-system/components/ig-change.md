# ig-change

## Proposito
Contrastar un valor anterior con uno nuevo mediante una secuencia antes → después.

## Marcado canonico
```html
<div class="ig-change">
  <span class="ig-change__label">Etiqueta</span>
  <span class="ig-change__values">
    <s class="ig-change__from">4 %</s>
    <span class="ig-change__arrow" aria-hidden="true">&rarr;</span>
    <strong class="ig-change__to">9 %</strong>
  </span>
</div>
```

## Variantes y estados
- `ig-change--worse`: destaca el nuevo valor con `--ds-danger-text` cuando el cambio es desfavorable.

## Accesibilidad
Conserva ambos valores, unidades y etiqueta como texto. El anterior tachado no debe ser la única fuente
para una comparación necesaria; expresa también el cambio en el texto cercano. La flecha se oculta a
tecnologías de asistencia y el orden de lectura es etiqueta, valor anterior y nuevo. Comprueba contraste
AA de `--ds-text-muted`, `--ds-text` y `--ds-danger-text` frente al fondo.

## Cuando usarlo y cuando no
Úsalo para una comparación de dos estados de la misma métrica; combínalo con `ig-section` o `ig-callout`.
Para una sucesión de más de dos momentos usa `ig-timeline`; para una cifra aislada, `ig-stat`.
