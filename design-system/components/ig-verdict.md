# ig-verdict

## Proposito
Cierra la narrativa con la idea final en un bloque de alto contraste.

## Marcado canonico
```html
<aside class="ig-verdict">
  <p class="ig-verdict__label">Veredicto</p>
  <p class="ig-verdict__text">Idea final</p>
</aside>
```

## Variantes y estados
No tiene variantes. Usa fondo `--ds-surface-inverse` y texto `--ds-text-inverse`.

## Accesibilidad
La idea final debe ser texto visible, no depender del contraste cromático para transmitir significado.
Verifica AA del par `--ds-text-inverse` sobre `--ds-surface-inverse`; colócalo tras las secciones.

## Cuando usarlo y cuando no
Úsalo una vez como conclusión después de `ig-section` y antes de `ig-footer`. No lo uses como tarjeta
recurrente para datos secundarios.
