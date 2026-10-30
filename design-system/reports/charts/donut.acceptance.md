# Tarea 2.C — aceptación de donut y pictogram

Se completaron los dos renders puros, CSS, siete pares de fixtures ES/EN, fichas y pruebas.
Solo se editaron archivos dentro del ownership asignado; no se hicieron commits.

## Comportamiento

Donut conserva el cuadrado de 220 px, orden horario desde las doce y separaciones de 2,2 px.
La leyenda contiene todas las etiquetas, valores y porcentajes reales; el centro muestra el total.
Sin total explícito, el centro muestra la suma con su unidad, sin añadir una etiqueta.
Las partes diminutas tienen tres grados mínimos; un highlight tiene diez para superar ocho px.
La expansión visual se documenta en la ficha, sin modificar valores ni porcentajes.

Pictogram usa diez columnas fijas de 20 px, con separación de 6 px, también a 280 px.
Los decimales recortan el siguiente icono horizontalmente; los vacíos conservan tono neutro y borde.
El coordinador confirmó por ask que value es siempre recuento sobre of, incluso con unit percent.
Se muestran recuento y porcentaje, respetando unit.decimals para el porcentaje.

Todas las etiquetas están en flujo HTML, sin densidad selectiva ni etiquetas sobre las marcas.
El cambio ancho/estrecho de donut se resuelve con la container query de 480 px.
No se necesitan mediciones aproximadas para ocultar datos: no se omite ninguna etiqueta.

## Evidencia de comandos

`pnpm next typegen && pnpm tsc --noEmit` — exit 0:

```text
Generating route types...
✓ Types generated successfully
```

`pnpm lint` — exit 0:

```text
$ eslint
```

`node scripts/dev/charts-schema-test.ts` — exit 0, línea final:

```text
99/99 fixtures passed
```

Los catorce fixtures nuevos aparecen como OK en la salida del schema.

`node scripts/dev/charts-render-test.ts` — exit 0:

```text
charts-render-test: 80 fixtures passed, 0 failure(s)
```

`node scripts/dev/charts-donut-test.ts` — exit 0:

```text
charts-donut-test: 11 cases passed, 0 failures
```

Los tests comprueban orden, posiciones finitas dentro del viewBox, suma angular y totales.
También comprueban datos visibles y en tabla, recuentos 0/completo/decimal y recorte al 50 %.
La prueba de highlight diminuto exige un arco mínimo de diez grados.

`node scripts/dev/charts-report.ts donut pictogram` — exit 0:

```text
Wrote design-system/reports/charts/donut.html (8 fixtures)
Wrote design-system/reports/charts/pictogram.html (10 fixtures)
```

`node scripts/dev/charts-layout-check.mjs donut pictogram` — exit 0:

```text
donut 360px light: 8 charts, 0 issue(s)
donut 360px dark: 8 charts, 0 issue(s)
donut 1280px light: 8 charts, 0 issue(s)
donut 1280px dark: 8 charts, 0 issue(s)
pictogram 360px light: 10 charts, 0 issue(s)
pictogram 360px dark: 10 charts, 0 issue(s)
pictogram 1280px light: 10 charts, 0 issue(s)
pictogram 1280px dark: 10 charts, 0 issue(s)
```

`grep -rnE` con el patrón de colores literales, sombras, gradientes e important de la tarea:
Sin salida; exit 1, el resultado esperado cuando no hay coincidencias.

`awk 'length > 100'` sobre renders, CSS, test, fichas y fixtures de estos tipos:
Sin salida; exit 0.

Node emite MODULE_TYPELESS_PACKAGE_JSON en los scripts TS; no causa errores de validación.

## Capturas e inspección visual

Se ejecutó shoot.mjs con file:// para cada tipo, 360/1280 px y light/dark.
Las ocho capturas están en shots y todas se abrieron e inspeccionaron.

```text
shoot: wrote donut-360-light.png (360x4640, light)
shoot: wrote donut-360-dark.png (360x4640, dark)
shoot: wrote donut-1280-light.png (1280x3752, light)
shoot: wrote donut-1280-dark.png (1280x3752, dark)
shoot: wrote pictogram-360-light.png (360x4263, light)
shoot: wrote pictogram-360-dark.png (360x4263, dark)
shoot: wrote pictogram-1280-light.png (1280x4623, light)
shoot: wrote pictogram-1280-dark.png (1280x4623, dark)
```

En móvil la leyenda queda debajo y conserva sus etiquetas largas sin recortarlas.
En escritorio queda al lado, con buen espacio entre el anillo y el texto.
El sector del 0,4 % se aprecia como una franja estrecha y su valor se lee en ambas lenguas.
Los seis sectores conservan el orden y el énfasis amarillo/rojo; el centro no invade el anillo.
Los pictogramas muestran siete iconos y medio, diez círculos completos y 37 cuadrados de cien.
El caso cero muestra cien personas neutras y una cifra explícita; los bordes separan los iconos.
No se observaron solapes, texto pegado al borde, recortes ni desbordamientos en ambos temas.
El espacio entre fixtures proviene del informe común, no del layout propio de estos gráficos.

Los HTML y layout.json son los artefactos repetibles para volver a comprobar el resultado.
