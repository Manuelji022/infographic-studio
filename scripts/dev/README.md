# Herramientas de revisión (desarrollo)

Scripts sin dependencias para revisar el design system en un navegador real. Necesitan Google Chrome
y un servidor de desarrollo en `http://localhost:3000` (`pnpm dev -p 3000`). Playwright (Oleada 5)
los sustituirá.

- `shoot.mjs <url> <salida.png> <ancho> <light|dark> [--cookie]`: captura de página completa por CDP.
  `--cookie` fija una cookie de sesión falsa (el `proxy.ts` solo comprueba que exista), lo que permite
  capturar rutas privadas como `/design-system` o `/components`. Para ver una zona de una página alta:
  `sips --cropToHeightWidth <alto> <ancho> --cropOffset <y> 0 <png> --out <recorte.png>`.
- `dialogtest.mjs`: prueba de comportamiento del `Dialog` en el catálogo (apertura, foco, Escape, clic en
  el fondo y en el relleno). Sirve de patrón para probar otros componentes interactivos.
- `shoot.mjs ... --selector=#id`: recorta la captura a un elemento (por ejemplo una sección del catálogo,
  `--selector=#composer`) y avisa si hay desbordamiento horizontal.
