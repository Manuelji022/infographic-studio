# ig-footer

## Proposito
Identifica autor, medio, fecha y fuentes citadas al final de la infografía.

## Marcado canonico
```html
<footer class="ig-footer">
  <p class="ig-footer__sources">Fuentes</p>
  <p class="ig-footer__meta">Autor, medio, fecha</p>
</footer>
```

## Variantes y estados
No tiene variantes. Separa fuentes y metadatos con margen si aparecen en ese orden; texto y filete son
atenuados.

## Accesibilidad
Incluye fuentes y metadatos como texto visible. Comprueba contraste AA de `--ds-text-muted` sobre el fondo;
el orden DOM presenta primero las fuentes y luego los metadatos.

## Cuando usarlo y cuando no
Cierra la pieza, después de `ig-verdict`, para atribución y trazabilidad. No sustituye las referencias
junto a datos concretos cuando sean necesarias.
