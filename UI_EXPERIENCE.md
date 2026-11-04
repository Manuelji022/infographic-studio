# Experiencia de la app y pantallas (fase de mockups)

> Estado: **borrador v0.2** · 2026-11-02 (D1–D7 confirmadas)
> Complementa `FUNCTIONAL_SPEC.md` (§10 Pantallas, §11 Hitos). Define **cómo se siente y cómo se ve** la app antes de que exista el agente. Cuando el propietario apruebe este documento, los cambios de alcance que contenga se trasladan a `FUNCTIONAL_SPEC.md`.

---

## 1. Propósito y alcance de esta fase

Construir **toda la interfaz con datos simulados** (mocks), sin agente, sin BD de aplicación y sin llamadas a modelos. El objetivo es validar la experiencia, los estados y el layout antes de invertir en M3.

**Dentro de la fase**

- Todas las pantallas de §4, navegables, con los estados de §5.
- Un **módulo de mocks** (`src/mocks/`) que sustituye al agente y a la BD detrás de interfaces claras, para poder cambiarlo por lo real sin tocar la UI.
- Textos en ES/EN desde el primer día (`messages/`).
- Temas claro/oscuro y responsive 360–1280 px.

**Fuera de la fase**

- Agente eve, `save_infographic`, traducción real, evals.
- Tablas de aplicación en la BD (`infographics`, …) y búsqueda real con `tsvector`.
- Persistencia real de chat, versiones o comentarios: en mocks viven en memoria y se pierden al recargar (salvo donde se indique `localStorage`).

> La biblioteca, el detalle y compartir ya están previstos en M2. Esta fase **absorbe M2 en su parte de UI** y añade la experiencia de generación y el espacio de refinamiento, que hasta ahora estaban descritos solo de forma textual en §10.

---

## 2. Principios de la experiencia

Tomados de la visión de producto (fin de semana) y de los principios del design system (§6.2).

1. **Genera primero. Refina conversando. Edita con precisión.** Cero configuración previa; la complejidad aparece solo cuando hace falta.
2. **La infografía es la protagonista.** El chrome de la app es mínimo y se aparta; la infografía tiene más libertad visual que la interfaz.
3. **Un solo gesto contextual.** Seleccionar un bloque y pedir un cambio es *una* interacción, no un modo de edición aparte. Comentar y "Editar con IA" son lo mismo: una instrucción anclada a un bloque.
4. **Sin pasos intermedios obligatorios.** Entrada → generación → infografía. Nada de pantallas de aprobación editorial.
5. **Honestidad antes que invención.** Si una petición exige datos que no están en el texto, la app lo dice; nunca rellena.
6. **Calma.** Mucho aire, bordes de 1 px, un único acento (arcilla) reservado a la acción principal de cada pantalla, sin sombras ni degradados.

---

## 3. Mapa de la app y flujo principal

```text
/login ──► /  (Generar) ──► /i/[id] (Espacio de trabajo: vista + chat + edición por bloque)
              │                  ▲  │
              │                  │  └─► Compartir ─► /s/[token] (público)
              ▼                  │
          /library ──────────────┘
          /account (menú de sesión)

Catálogos privados (ya existen): /design-system  /components  /charts
Errores: not-found (404), error global, 403/sesión caducada, enlace compartido no válido
```

**Flujo principal (camino feliz)**

1. El propietario entra en `/login` → "Continuar con Google" → aterriza en `/`.
2. Pega el texto, opcionalmente elige tipo de contenido (por defecto **Auto**) y pulsa **Generar**.
3. La pantalla pasa a un estado de progreso (la propia pantalla, sin navegar). Al terminar, se navega a `/i/[id]`.
4. En el espacio de trabajo ve la infografía grande. Puede abrir el chat a la derecha o pasar el ratón por un bloque, seleccionarlo y pedir un cambio.
5. La infografía **ya está guardada** desde que se genera (ver decisión D1). Aparece en la biblioteca; puede compartirla o descargarla.

---

## 4. Inventario de pantallas

| # | Ruta | Pantalla | Acceso | Prioridad |
|---|---|---|---|---|
| 1 | `/login` | Login | público | P0 (existe, se revisa) |
| 2 | `/` | Generar | privado | P0 |
| 3 | `/i/[id]` | Espacio de trabajo (vista + refinamiento) | privado | P0 |
| 4 | `/library` | Biblioteca | privado | P0 |
| 5 | `/s/[token]` | Vista compartida | público | P0 |
| 6 | (diálogo) | Compartir | privado | P0 |
| 7 | (diálogo) | Confirmar eliminación | privado | P0 |
| 8 | `not-found` | 404 (app privada) | ambos | P0 |
| 9 | `/s/[token]` inválido | Enlace no disponible | público | P0 |
| 10 | `error.tsx` | Error inesperado | ambos | P0 |
| 11 | (cabecera) | Menú de cuenta y toggle ES/EN | privado | P0 |
| 12 | (panel) | Historial de versiones | privado | P1 |

Las secciones siguientes describen cada pantalla: propósito, layout, comportamiento, estados y componentes del DS a reutilizar o crear.

---

### 4.1 Login — `/login`

**Propósito:** entrar con Google. Nada más.

**Layout:** tarjeta centrada vertical y horizontalmente sobre `canvas`. Marca/nombre del producto en serif, una línea de descripción, botón "Continuar con Google". Pie discreto con el toggle ES/EN.

**Estados**

| Estado | Comportamiento |
|---|---|
| Reposo | Botón activo. |
| Redirigiendo | Botón deshabilitado con `Spinner`. |
| Email no permitido | Mensaje genérico ("Esta cuenta no tiene acceso."), sin revelar la allowlist. |
| Error de OAuth | Mensaje + "Reintentar". |
| Ya autenticado | Redirige a `/` sin mostrar nada. |

**Reutiliza:** `Card`, `Button`, `Text`, `LanguageToggle`, `ErrorMessage`. Ya existe `src/app/login/`; esta fase lo pule y añade los estados de error.

---

### 4.2 Generar — `/` (pantalla por defecto tras el login)

**Propósito:** pegar el contenido y generar. Es la pantalla más importante de la fase y la más sobria.

**Layout (escritorio)**

```text
┌──────────────────────────────────────────────────────────────┐
│ ◈ Infographic Studio              Biblioteca    ES|EN   [◉]  │  ← AppHeader mínimo
├──────────────────────────────────────────────────────────────┤
│                                                              │
│            Pega un texto. Te devolvemos una infografía.      │  ← display serif, una línea
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │                                                      │   │
│   │   Pega aquí un artículo, una entrevista o un         │   │  ← Textarea grande, crece
│   │   informe financiero…                                │   │
│   │                                                      │   │
│   │                                                      │   │
│   │ [ Auto ▾ ] [+ URL de origen]  12.480 / 30.000  [Generar]│  │  ← selector abajo-izquierda
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Elementos**

- **Textarea** grande y centrada (ancho de prosa ~880 px), foco automático al entrar. Placeholder explicativo.
- **Selector de tipo de contenido**, pequeño, en la esquina inferior izquierda del contenedor. Opciones: **Auto** (por defecto), **Entrevista**, **Artículo**, **Estado financiero**. Cada opción lleva una descripción corta de una línea en el desplegable. La lista sale de una constante única para poder añadir tipos sin tocar el componente.
- **Contador** de caracteres con aviso suave al superar ~30.000 (GEN-11); no bloquea.
- **Botón Generar**: el único elemento con acento arcilla. Deshabilitado si el texto está vacío. Atajo `⌘/Ctrl + Enter`.
- **URL de origen (opcional):** único campo adicional. Se muestra como una acción discreta "Añadir URL de origen" junto al selector; al pulsarla se despliega una línea de `Input` dentro del contenedor. Se valida solo el formato; sirve para la fuente del pie (`ig-footer`) y los metadatos.
- **No hay** campos de título, tema ni idioma. El **agente decide el título** (editable después en línea desde el espacio de trabajo) y **el idioma** (el del texto original, GEN-03). Cualquier cambio posterior, como traducir, se pide por el chat. Ver decisión D2.
- **Ejemplos** (opcional, P1): debajo, 2–3 chips discretos "Probar con un ejemplo" que rellenan el textarea con un texto de muestra, útil para demos.

**Estados**

| Estado | Comportamiento |
|---|---|
| Vacío | Generar deshabilitado. |
| Con texto | Generar activo; contador visible. |
| Texto muy largo | Aviso no bloqueante junto al contador. |
| **Generando** | El composer se bloquea (solo lectura) y debajo aparece `GenerationProgress` con los pasos: *Leyendo el texto → Redactando la narrativa → Componiendo la infografía → Revisando*. Botón "Cancelar". No hay navegación hasta terminar. |
| Error | Mensaje con acción "Reintentar"; **el texto se conserva siempre**. Referencia del error plegada. |
| Éxito | Navega a `/i/[id]` con transición suave. |

**Mock:** el "agente" espera 6–10 s simulados, avanzando los pasos, y devuelve una de las infografías de muestra según el tipo elegido (`Auto` elige una al azar o por palabras clave). Un parámetro de desarrollo permite forzar el error (`?mock=error`).

**Reutiliza / crea:** `PromptComposer` (**se rediseña**: hoy incluye título, URL, tema e idioma; pasa a ser textarea + selector de tipo + URL opcional + botón; se eliminan título, tema e idioma de salida), `GenerationProgress`, `Select` o un nuevo `ContentTypeSelect` compacto, `ErrorMessage`.

---

### 4.3 Espacio de trabajo — `/i/[id]`

**Propósito:** ver la infografía, refinarla con lenguaje natural y editar un bloque concreto. Sustituye a la pantalla "Detalle" de la spec y absorbe "Refinar".

**Layout (escritorio ≥ 1024 px)**

```text
┌──────────────────────────────────────────────────────────────────────┐
│ ← Biblioteca   Título de la infografía  ✎        ↶ ↷  Compartir  ⋯ 💬│  ← barra fina
├────────────────────────────────────────────────────┬─────────────────┤
│                                                    │ Chat            │
│        ┌──────────────────────────────┐            │ ─────────────── │
│        │                              │            │  Tú: Hazla más  │
│        │      INFOGRAFÍA (iframe)     │            │  ejecutiva      │
│        │                              │            │                 │
│        │  ┌──────── bloque ─────────┐ │            │  ◈ Hecho. He    │
│        │  │ gráfico  ⌖ ✎ ⟳          │ │ ← acciones │  acortado 3     │
│        │  └─────────────────────────┘ │   al hover │  textos…  [Deshacer]│
│        │                              │            │                 │
│        └──────────────────────────────┘            │ ─────────────── │
│                                                    │ [Pide un cambio…]│
└────────────────────────────────────────────────────┴─────────────────┘
```

**Área central**

- Infografía renderizada en `<iframe sandbox srcdoc>` con `buildDocument` (ya existe), centrada, ancho de prosa de la infografía, mucho aire alrededor sobre `canvas`.
- Barra superior fina (no cabecera de app completa): volver, título editable en línea, deshacer/rehacer, Compartir, menú "⋯" (Descargar `.html`, Copiar HTML, Texto original, Historial, Eliminar) y botón para abrir/cerrar el chat.
- Selector de **tema** claro/oscuro/auto de la infografía dentro del menú "⋯" (no ocupa sitio fijo).

**Panel de chat (derecha)**

- Colapsable; en escritorio abierto por defecto la primera vez que se entra tras generar, y recordando la preferencia después (`localStorage`).
- Ancho ~360 px. En tablet se superpone; en móvil es una hoja inferior (§6).
- Historial de instrucciones y respuestas. Cada respuesta del sistema indica **qué cambió** ("He actualizado 2 bloques: *Gasto por función*, *Conclusión*") con botón **Deshacer** y chips que, al pulsarlos, resaltan esos bloques en la infografía.
- Caja de entrada al pie con envío por `Enter`. Si hay un bloque seleccionado, aparece un **chip de contexto** ("Gráfico: Gasto por función ✕") y la instrucción se aplica a ese bloque; quitar el chip la hace global (decisión D4).
- Sugerencias iniciales (chips) la primera vez: "Hazla más ejecutiva", "Reduce el texto", "Estilo más minimalista", "Destaca las conclusiones".
- Estado "trabajando": mensaje del sistema con spinner y descripción del paso ("Actualizando el gráfico…"). La infografía sigue visible.
- Si la petición no es viable con los datos del texto: respuesta explicativa, **sin cambios** y sin botón deshacer ("El texto no incluye datos de 2022, así que no puedo añadir esa comparación.").

**Interacción contextual con bloques**

| Acción | Comportamiento |
|---|---|
| Hover sobre un bloque | Contorno sutil de 1 px y una pequeña etiqueta con el tipo ("Gráfico de barras") en la esquina; aparecen 3 acciones discretas: **Comentar**, **Editar con IA**, **Regenerar**. Nada visible en reposo. |
| Clic en un bloque | Lo **selecciona**: contorno acento, y el foco pasa a la entrada del chat con el chip de contexto. Clic fuera o `Esc` deselecciona. |
| Editar con IA | Abre/enfoca el chat con el bloque seleccionado. Es la misma entrada de siempre, no un modo nuevo. |
| Comentar | Abre un pequeño popover anclado al bloque con un campo de texto y la elección "Solo guardar nota / Pedir cambio a la IA". Los bloques con comentarios muestran un indicador numérico; los comentarios también aparecen listados en el chat. |
| Regenerar | Repite el bloque con la última instrucción o sin instrucción nueva; muestra el mismo estado de progreso local. |
| Cambio en curso | El bloque afectado muestra un velo ligero con spinner; el resto sigue interactivo y **no parpadea ni se recoloca**. |
| Cambio aplicado | El bloque se actualiza en el sitio con un resalte breve (~1,2 s) y aparece "Deshacer" en el chat y en la barra. |

> **Cómo se identifica un bloque en el mock.** En esta fase se usa `data-block-id` en los elementos de primer nivel dentro de cada `ig-section` y en cada `ig-chart`. El iframe notifica hover/clic al padre con `postMessage`; el padre dibuja los overlays. El iframe sigue sin `allow-scripts` en las vistas público/exportación; para el espacio de trabajo hace falta una capa de interacción que se decide en D5.

**Estados de la pantalla**

| Estado | Comportamiento |
|---|---|
| Carga | Esqueleto de la infografía (`Skeleton`). |
| Normal | Descrito arriba. |
| Edición global en curso | Indicador en el chat y barra de progreso fina en la parte superior del área central. |
| Edición local en curso | Velo solo sobre el bloque. |
| Error de edición | Mensaje en el chat con "Reintentar"; el documento no cambia. |
| Idioma solicitado inexistente | Aviso con botón "Traducir a inglés/español" (I18N-05). |
| Infografía no encontrada | 404 dedicado (§4.8). |

**Reutiliza / crea:** `Button`, `Textarea`, `Icon`, `Dialog`, `Badge`, `Skeleton`, `Spinner`. **Nuevos composites:** `WorkspaceBar`, `ChatPanel` (con `ChatMessage`, `ChatComposer`, `ContextChip`), `BlockOverlay` (hover/selección/acciones), `CommentPopover`, `UndoToast`.

---

### 4.4 Biblioteca — `/library`

**Propósito:** encontrar y reabrir trabajo guardado. No domina la experiencia inicial.

**Layout:** cabecera de app; buscador amplio arriba; filtros en una fila compacta; rejilla de tarjetas.

- **Buscador** (`SearchBar`): full-text en ambos idiomas; estado en la URL (`?q=&tag=&lang=&sort=`).
- **Filtros** (`FilterBar`): etiqueta, idioma, "compartidas", rango de fechas; orden por relevancia o fecha. Los filtros extra se pliegan tras un botón "Filtros".
- **Tarjeta** (`InfographicCard`): miniatura, título, resumen (2 líneas), etiquetas, fecha, banderas ES/EN, indicador de compartida y menú "⋯" (Abrir, Compartir, Descargar, Eliminar).
- Clic en la tarjeta → `/i/[id]` (se puede seguir editando).
- Botón principal "Nueva infografía" → `/` (acento).

**Estados:** cargando (rejilla de `Skeleton`), vacío sin infografías (`EmptyState` invitando a generar la primera), vacío por búsqueda sin resultados (sugerir quitar filtros), error de carga (`ErrorState` + reintentar), una sola página en mocks con paginación "Cargar más" (P1).

**Mock:** 8–12 infografías ficticias, algunas con versión ES+EN, algunas compartidas, con etiquetas variadas; la búsqueda filtra en cliente por título/resumen/etiquetas.

---

### 4.5 Vista compartida — `/s/[token]`

**Propósito:** que un invitado vea solo la infografía, sin cuenta.

**Layout:** infografía a pantalla completa en su documento (`embed`), sin cabecera de app. Barra mínima superior o inferior discreta con el título y, si existen las dos versiones, el toggle ES/EN. Pie con la fuente. Nada más: sin enlaces a la biblioteca, sin texto original, sin chat ni acciones de edición.

**Estados:** normal, cargando, infografía con una sola lengua (sin toggle), token inválido/revocado/caducado → pantalla 4.9.

**Mock:** tokens de ejemplo `demo-activa`, `demo-caducada`, `demo-revocada`.

---

### 4.6 Diálogo Compartir

Desde la barra del espacio de trabajo o el menú de la tarjeta (`ShareDialog`, ya existe).

- Sin enlace: botón "Crear enlace".
- Con enlace: URL + "Copiar enlace", selector de idioma por defecto (navegador / ES / EN), caducidad (nunca / 7 / 30 días), "Compartir…" (Web Share en móvil) y "Revocar enlace" con confirmación.
- Feedback inmediato al copiar ("Copiado").

### 4.7 Diálogo Confirmar eliminación

`ConfirmDialog`: explica que se revocan los enlaces compartidos, botón destructivo y cancelar. Tras eliminar, vuelve a `/library` con un aviso.

---

### 4.8 404 de la app — `not-found`

**Cuándo:** ruta inexistente o infografía `/i/[id]` que no existe.

**Layout:** centrado, mismo lenguaje que el login. Número "404" discreto en `heading`, una frase clara en serif ("No encontramos esta página."), y dos acciones: **Ir a Generar** (acento) y **Biblioteca** (outline). Si hay sesión, usa la cabecera de app; si no, la versión mínima.

### 4.9 Enlace compartido no disponible

**Cuándo:** token inexistente, revocado o caducado. **Nunca distingue** la causa (§8 de la spec).

**Layout:** igual que 4.8 pero sin cabecera de app ni enlaces a la biblioteca: "Este enlace no está disponible." y una línea neutra. Sin acciones salvo, si el visitante tiene sesión de propietario, un enlace a la app (decisión menor).

### 4.10 Error inesperado — `error.tsx` y `global-error.tsx`

Mensaje humano ("Algo salió mal."), botón **Reintentar** (`reset()`), enlace a Generar, y **referencia del error** plegada en `<details>` (reutiliza `ErrorMessage`). Nunca muestra trazas.

### 4.11 Cabecera, menú de cuenta y toggle ES/EN

`AppHeader` simplificado a: marca (enlace a `/`), enlace a **Biblioteca**, `LanguageToggle`, `UserMenu` (email, cerrar sesión). Sin navegación adicional. En el espacio de trabajo se sustituye por la barra fina de §4.3.

### 4.12 Historial de versiones (P1)

Panel lateral o diálogo, accesible desde "⋯ → Historial". Lista cronológica: instrucción que originó el cambio, bloques afectados (nombres), hora y botón **Restaurar**. Sin diff visual. Deshacer/rehacer de la barra recorre la misma lista.

---

## 5. Estados transversales

| Situación | Patrón |
|---|---|
| Cargando una pantalla | `Skeleton` con la forma del contenido, nunca un spinner a pantalla completa. |
| Cargando una acción | `Spinner` dentro del botón o del bloque afectado. |
| Vacío | `EmptyState` con una acción concreta. |
| Error recuperable | `ErrorMessage` con acción de reintento; el contenido del usuario nunca se pierde. |
| Error de sistema | Referencia estable plegada en `<details>`. |
| Confirmaciones | Solo para acciones destructivas o irreversibles; lo demás se resuelve con "Deshacer". |
| Éxito | Aviso breve no bloqueante (toast) con acción de deshacer si procede. |
| Sesión caducada | Redirige a `/login` conservando el borrador del textarea en `sessionStorage`. |

---

## 6. Responsive y accesibilidad

| Ancho | Generar | Espacio de trabajo | Biblioteca |
|---|---|---|---|
| ≥ 1024 px | Centrado, textarea ~880 px | Vista + chat lateral (~360 px) | Rejilla de 3–4 columnas |
| 640–1023 px | Centrado | Chat superpuesto desde la derecha | 2 columnas |
| 360–639 px | Textarea a ancho completo, selector y botón en dos filas si hace falta | Chat como **hoja inferior**; acciones de bloque con **toque** (no hover): tocar selecciona y muestra una barra de acciones inferior | 1 columna |

- Foco visible, navegación completa por teclado: los bloques son enfocables con `Tab` dentro del espacio de trabajo y `Enter` los selecciona; `Esc` deselecciona.
- El chat usa `aria-live="polite"` para las respuestas; el progreso usa `GenerationProgress` (ya con `aria-current`).
- Contraste AA en ambos temas (ya garantizado por tokens). Sin acciones solo-hover: todo equivalente por teclado y táctil.
- `prefers-reduced-motion`: sin transiciones de resalte; solo cambio de contorno.

---

## 7. Datos simulados (mocks)

Todo el acceso a datos pasa por **una capa con la misma forma que tendrá la real**, para que sustituirla en M3 sea cambiar la implementación y no la UI.

```text
src/mocks/
├── fixtures/          # infografías de muestra (reutiliza design-system/examples)
├── agent.ts           # generate(), editBlock(), editGlobal(): promesas con retardos y fallos simulables
├── store.ts           # lista/lectura/borrado/compartir en memoria (+ localStorage opcional)
└── README.md          # cómo forzar errores y estados (?mock=error, ?mock=slow, ?mock=empty)
```

- **Tipos de contenido:** `Auto`, `Interview`, `Article`, `Financial` definidos en una constante única con `id`, etiqueta i18n y descripción corta.
- **Infografías de muestra:** las dos existentes (`gasto-publico`, `pensiones`) más una entrevista y un estado financiero cortos, en ES y EN, con sus specs de gráficos.
- **Ediciones simuladas:** `editBlock` devuelve una variante precocinada del bloque (p. ej. barras → líneas, abreviar cita) tras 1,5–3 s, para demostrar el flujo local sin tocar el resto del HTML. `editGlobal` aplica una transformación determinista a varios bloques.
- **Errores simulables:** generación fallida, edición fallida, petición inviable por falta de datos.

> Aviso de honestidad: los mocks no validan nada de lo que dice el usuario. Su único objetivo es probar la interfaz. Que el cambio quede "bien" no demuestra que el agente sepa hacerlo.

---

## 8. Plan de implementación por oleadas

Orden pensado para que cada oleada se pueda revisar visualmente y para que los workers toquen **archivos disjuntos**. Los modelos de cada rol siguen la tabla de `AGENTS.md`. Cada tarea cierra con `pnpm tsc --noEmit` y `pnpm lint`, capturas con `scripts/dev/shoot.mjs` en claro/oscuro a 360 y 1280 px, y la pantalla visible en un catálogo o ruta.

| Oleada | Contenido | Dependencias | Tipo |
|---|---|---|---|
| **U0 — Fundamentos** (coordinador) | Aprobar este documento y resolver D1–D5. Añadir `src/mocks/` con tipos y la capa `agent`/`store`. Layout base (grupos de rutas privada/pública, `not-found`, `error`). Claves i18n de todas las pantallas en `messages/` | — | Coordinador |
| **U1 — Entrada y errores** | Login pulido, 404, enlace no disponible, error inesperado, `AppHeader` simplificado | U0 | Frontend (sonnet); copys con haiku |
| **U2 — Generar** | Rediseño de `PromptComposer`, selector de tipo de contenido, estados de generación y error contra el mock, transición a `/i/[id]` | U0 | Frontend (sonnet) |
| **U3 — Biblioteca** | `/library` con buscador, filtros, rejilla, estados vacío/error/carga, menú de tarjeta, eliminar | U0 | Frontend (sonnet) |
| **U4 — Vista y compartir** | `/i/[id]` solo lectura (barra, iframe, menú "⋯", descargar/copiar), diálogo Compartir, `/s/[token]` con idioma | U0, U1 | Frontend (sonnet) |
| **U5 — Panel de chat** | `ChatPanel` y composites, historial, chip de contexto, estados, deshacer; plegado/ responsive; edición **global** simulada | U4 | Frontend (sonnet) |
| **U6 — Bloques** | `BlockOverlay`, hover/selección, acciones, `CommentPopover`, edición **local** simulada, indicador por bloque, teclado y táctil | U4, U5 | Frontend (sonnet), alto riesgo UX |
| **U7 — Historial y pulido** | Deshacer/rehacer, panel de versiones, atajos, responsive final, revisión de accesibilidad | U5, U6 | Frontend (sonnet) |
| **U8 — Cierre** | Prueba E2E de recorrido completo con informe, actualización de `FUNCTIONAL_SPEC.md` y plan de sustitución de mocks | Todas | Coordinador + verificador (haiku) |

Paralelismo posible: U1, U2 y U3 en paralelo tras U0; U4 tras U1; U5 y U6 son secuenciales por compartir el espacio de trabajo.

**Verificación E2E de la fase (artefacto repetible):** un script en `scripts/dev/` recorre login (sesión simulada) → generar con mock → abrir espacio de trabajo → seleccionar un gráfico → pedir un cambio → comprobar que **solo cambió ese bloque** (comparando el HTML de los demás por `data-block-id`) → deshacer → compartir → abrir el enlace → 404 con token inválido. Emite un informe en `design-system/reports/`.

---

## 9. Decisiones

Estas decisiones cambian lo que ya está escrito en `FUNCTIONAL_SPEC.md`. **D1–D7 confirmadas por el propietario el 2026-11-02.** Al cerrar la fase (U8) se trasladan a la spec.

| ID | Pregunta | Propuesta | Por qué |
|---|---|---|---|
| **D1** ✅ | La spec define *draft → Conservar / Descartar*. La visión nueva elimina pasos intermedios. ¿Se guarda automáticamente al generar? | **Confirmado: guardar al generar** (`saved`) y permitir Eliminar; mantener `draft` solo si falla algo a mitad. | Coherente con "Generar primero". Al trasladar a la spec: revisar GEN-07, LIB-01, SRCH-01, §3.1 y el cron de borradores (M4). |
| **D2** ✅ | La spec ofrece título, URL, tema e idioma de salida en la pantalla de Generar. | **Confirmado:** se quitan título, tema e idioma. **Se conserva solo la URL de origen (opcional).** El agente decide título e idioma; el título se edita luego en línea. | Pantalla calmada. Al trasladar a la spec: GEN-02 y GEN-03 (se elimina el selector de idioma de salida). |
| **D3** ✅ | Tipos de contenido (Auto / Entrevista / Artículo / Financiero): ¿en esta fase solo UI? | **Solo UI y mock**; el enrutado a agentes especializados entra en M3. El valor viaja ya en la petición al mock. | Evita adelantar el diseño del agente. |
| **D4** ✅ | ¿El chat con un bloque seleccionado lo aplica solo a ese bloque? | **Sí**, con chip de contexto visible y quitable. | Un solo gesto contextual, sin modos. |
| **D5** ✅ | Edición por bloques exige interacción dentro del iframe, hoy sin scripts. ¿Cómo? | Para la vista **privada de trabajo**, superponer los controles **fuera** del iframe midiendo rectángulos de bloques (`data-block-id`) con un script mínimo inyectado solo en esa vista; las vistas pública y exportada siguen sin scripts. Alternativa: renderizar la infografía sin iframe en la vista privada. | Mantiene el aislamiento (§8). Hay que revisar la CSP y la regla "sin JS" (GEN-08) para esta vista. |
| **D6** ✅ | ¿Documento JSON estructurado como representación canónica, como propone la visión? | **Fuera de esta fase.** Los mocks asumen bloques identificables en el HTML (`data-block-id`) y una capa `agent.ts` independiente del formato. Decidir en M3 con los resultados de esta fase. Ya está considerado en §5.6 de la spec. | Es una decisión de arquitectura grande (afecta a validación, traducción y BD) que no necesita bloquear la UI. |
| **D7** ✅ | Versiones: la spec marca el historial como P2 (LIB-06). ¿Sube a P1? | **Deshacer/rehacer sí en esta fase; panel de historial P1.** | La edición conversacional pide poder revertir. |

## 10. Preguntas abiertas

- ¿Los comentarios son **notas persistentes** o solo instrucciones a la IA? (El documento asume ambas; si solo la segunda, se simplifica 4.3.)
- ¿Se permite **seleccionar varios bloques** a la vez? Propuesta: no en v1.
- ¿La barra de herramientas del espacio de trabajo muestra el idioma activo y "Traducir" o va dentro del menú "⋯"?
- Marca y nombre final del producto (hoy "Infographic Studio") para login y 404.
- Miniaturas de la biblioteca: ¿captura estática precalculada o render reducido de la infografía?

## 11. Fuera de esta fase

Agentes especializados, enrutador de ediciones real, persistencia y versionado en BD, búsqueda real, traducción real, diferencias visuales entre versiones, comentarios colaborativos, múltiples usuarios, exportación PNG/PDF.

## 12. Plan de sustitución de mocks (entrada a M3)

Estado al cierre de la fase (2026-11-04): toda la UI corre contra `src/mocks/`, que es el único punto de acceso a datos. La sustitución debe cambiar implementaciones, no componentes ni rutas.

| Mock actual (`src/mocks/`) | Sustituto en M3 | Notas |
|---|---|---|
| `store.ts` (Map en `globalThis`, 8 semillas) | Consultas Drizzle sobre `infographics`, `infographic_contents`, `share_links` (§7 de la spec) | Tablas nuevas con migración nombrada por funcionalidad; no editar `drizzle/` a mano. Revisar índices para biblioteca (orden, filtros, `from/to`). |
| `store.ts` `pushEdit` / `moveHistory` / `jumpHistory` | Tabla de ediciones o columna `history` por infografía | Mantener la semántica: el cursor, el truncado de la cola de rehacer al editar y el contador `blockSeq` que nunca retrocede. |
| `store.ts` `comments` (en memoria) | Tabla de comentarios por bloque | Decisión abierta (§10): notas persistentes o solo instrucciones. |
| `store.ts` `lookupSharedToken` | Consulta por token con `expires_at` y `revoked_at` | La UI no distingue causas (caducado, revocado, inexistente): conservar. |
| `actions.ts` `generateInfographic` (`pickExampleFor`, `buildFromExample`) | Llamada al agente (eve, M3) que devuelve el HTML validado y `save_infographic` | Sustituye también la lógica de tipo de contenido (D3). |
| `actions.ts` `editGlobal` / `editBlock` (retardos y variantes precocinadas) | Enrutador de ediciones del agente | Sin cambios de forma: `editBlock` solo debe tocar el bloque seleccionado (D4). |
| `actions.ts` `createShareLink` / `updateShareLink` / `revokeShareLink` | Mismas acciones sobre `share_links` | El token debe ser aleatorio y no reutilizable. |
| Flags `?mock=error|slow|empty` | Se retiran al final de M3 | Los estados de error reales deben venir del agente y de la BD. |

**Orden sugerido en M3:**
1. Spike de importación de `db/` y `design-system/` desde `agent/` (riesgo señalado en la spec).
2. Migraciones de la aplicación y repositorio de lectura (solo lectura primero: biblioteca y vista).
3. Compartir y `/s/[token]` contra la BD.
4. Generación y ediciones con el agente.
5. Retirar `src/mocks/` y los flags `?mock=`.

**Riesgos que la fase deja anotados:**
- `proxy.ts` solo comprueba que existe la cookie de sesión, no que sea válida. Cualquier cookie falsa accede a `/i/*`, a la descarga y a `/library/preview`. Validar la sesión con Better Auth en M3 (decisión de auth, alto riesgo: Opus revisa).
- El validador y el manifest deben aceptar `data-block-id`, o las ediciones por bloque no pasan la validación real.
- Las traducciones deben conservar los ids de bloque (ES y EN tienen contadores independientes).
- Bloques `ig-bar-chart` sin spec solo admiten ediciones de texto.
- La excepción de contraste `on-data-6` (4,44:1 en claro) es anterior a esta fase y sigue abierta.
