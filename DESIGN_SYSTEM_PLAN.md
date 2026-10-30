# Design system — Plan de implementación (M1)

> Estado: **borrador v0.1** · 2026-10-30
> Documento de trabajo para iterar los pasos y delegarlos. Cuando se cierre, los cambios de alcance se vuelcan en `FUNCTIONAL_SPEC.md` §6 y §11 (la spec manda; este plan es el "cómo").
> Convención: `[ ]` pendiente · `[~]` en curso · `[x]` hecho y revisado.

---

## 1. Objetivo y alcance

Un único design system con **estética editorial de papel cálido** (superficies marfil, serif para el cuerpo, un solo acento arcilla), que sirve a **dos consumidores** con tokens compartidos:

| Capa | Qué es | Dónde vive | Cómo se estiliza |
| --- | --- | --- | --- |
| **Tokens y temas** | Fuente de verdad (JSON DTCG) → CSS generado | `design-system/tokens/` | Custom properties `--ds-*` |
| **UI de la app** | Componentes React: primitivas y composites (p. ej. `PromptComposer`) | `design-system/ui/` | CSS Modules sobre tokens |
| **Infografía** | Vocabulario cerrado `ig-*` en HTML plano (lo compone el agente, se exporta autocontenido) | `design-system/infographic/` | CSS global, sin JS |

Fuera de alcance de M1: generación con el agente (M3), biblioteca y compartir (M2), cursivas, `latin-ext`, Figma.

## 2. Decisiones

| # | Decisión | Estado | Recomendación / resultado |
| --- | --- | --- | --- |
| D1 | El sistema cubre UI de la app **e** infografías, con tokens compartidos | **Decidido** (en la spec §6, §12) | Sí, dos capas de componentes |
| D2 | Clay también como color de datos en infografías | **Decidido** (spec §12) | Clay = color principal de datos, slate = neutro, paleta cálida categórica (valores por definir en la Oleada 1) |
| D3 | Fuentes | **Decidido** | Source Serif 4 (cuerpo/serif), Geist (sans/UI), Geist Mono (código) |
| D4 | Tema oscuro derivado | **Decidido y aprobado** (2026-10-30) | Derivado en M1; aprobado por el propietario sobre el catálogo |
| D5 | Descartar el trabajo de la oleada 1 (`design-system/*.css`, escalas azul/gris) | **Decidido** (spec §12) | Descartar; los archivos se retiran en la tarea 0.3 y se reescriben con el generador |
| D6 | Generador de tokens | **Decidido** | Script propio en JS, sin dependencias (`scripts/build-tokens.mjs`) |
| D7 | Prefijos | **Propuesto** | Tokens `--ds-*` · clases infografía `ig-*` · props de datos de infografía `--ig-*` (`--ig-value`, `--ig-max`) · componentes UI con CSS Modules |
| D8 | Los componentes del DS **no llevan textos propios**: reciben strings por props; i18n vive en la app | **Propuesto** | Evita conflictos en `messages/*.ts` entre workers y mantiene el DS reutilizable |
| D9 | Runner E2E | **Propuesto** | Playwright (necesario para la deuda de M0 y la regresión visual) |

> D1, D2, D4 y D5 están reflejadas en `FUNCTIONAL_SPEC.md` (§6, §12). Las propuestas D7–D9 también quedaron en la spec; si cambia alguna, se corrige allí primero.

## 3. Principios de diseño (reglas duras para workers y revisión)

1. **Plano, sin sombras ni degradados.** Elevación por tono de superficie (`canvas → surface → surface-feature`) y bordes de 1 px.
2. **Clay solo para la acción principal** de una pantalla (un CTA). Nunca decoración, iconos ni hover genérico. (En datos de infografía, ver D2.)
3. **Cuerpo en serif, UI en sans.** El serif lleva la voz; Geist se reserva a controles, navegación, etiquetas y al titular declarativo.
4. **Ningún blanco puro ni frío.** Todo el neutro sale de la familia marfil/slate.
5. **Cero colores literales fuera de los primitivos.** Los componentes solo usan tokens semánticos (`var(--ds-…)`).
6. **Contraste AA** (4.5:1 texto, 3:1 componentes grandes e iconos) verificado por script en ambos temas. `cloud-medium` nunca para texto.
7. **Foco visible** siempre (`:focus-visible`), con anillo slate.
8. **Enlaces con subrayado persistente.**
9. **Responsive de 360 a 1280 px.** Display y heading fluidos con `clamp()`.
10. **React 19:** `ref` como prop (sin `forwardRef`), variantes explícitas (no props booleanas), composición con subcomponentes, sin estado global dentro del componente (`vercel-composition-patterns`).
11. **Sin strings propios** en componentes (D8).
12. **Sin `!important`, sin Tailwind, sin dependencias nuevas** salvo aprobación.

## 4. Arquitectura de carpetas

```text
design-system/
├── fonts/                         # woff2 + licencias + fonts.css   ✅ hecho
├── tokens/
│   ├── primitives.tokens.json     # colores, fuentes, spacing, radius (de la referencia, limpio)
│   ├── typography.tokens.json     # ~15 roles tipográficos deduplicados
│   ├── semantic.tokens.json       # roles: canvas, surface, text, accent… (alias)
│   ├── themes/light.tokens.json
│   ├── themes/dark.tokens.json
│   └── build/                     # GENERADO: tokens.css, themes.css, typography.css
├── ui/
│   ├── primitives/                # Button, Text, Link, Badge, Card, Input, Textarea…
│   ├── composites/                # PromptComposer, AppHeader, InfographicCard…
│   └── index.ts
├── infographic/
│   ├── components.css             # vocabulario ig-*
│   ├── manifest.ts                # clases/variantes/props permitidas (fuente de verdad)
│   ├── validate.ts                # validador determinista (§5.5 de la spec)
│   └── render.ts                  # buildDocument(): fragmento → documento / export
├── components/                    # fichas .md por componente (propósito, marcado, cuándo usarlo)
├── examples/                      # infografías de referencia (ES y EN)
├── catalog/                       # secciones del catálogo vivo (/design-system)
└── CHANGELOG.md
scripts/
├── build-tokens.mjs               # JSON → CSS (+ check de deriva)
├── check-contrast.mjs             # informe AA de ambos temas
└── sync-design-system-fonts.mjs   # ✅ existe
```

Alias de TypeScript: `@ds/*` → `design-system/*` (se añade en la Oleada 0).

## 5. Contrato de tokens (se congela en la Oleada 0)

Los workers dependen de estos nombres; cambiarlos después implica revisar todo.

### 5.1 Reglas del generador

- Ruta JSON → variable: `color.slate-dark` → `--ds-color-slate-dark`; `spacing.16` → `--ds-spacing-16`; `radius.3xl` → `--ds-radius-3xl`.
- Alias DTCG `{color.clay}` → `var(--ds-color-clay)`.
- Tipografía compuesta → `--ds-type-{rol}-family | size | weight | leading | tracking` y una clase utilitaria `.ds-type-{rol}`.
- `$extensions.ds.fluid: { min, max }` → `clamp(min, <pendiente-vw>, max)` calculado entre 360 y 1280 px.
- Temas: `[data-ds-theme="light"]`, `[data-ds-theme="dark"]` y `@media (prefers-color-scheme: dark) { [data-ds-theme="auto"] }`. Sin tema declarado = claro bajo `:root`.
- Falla el build si: hay un alias roto, un `$value` inválido (p. ej. `80-120px`), o falta una clave semántica en un tema.
- `--check`: regenera en memoria y compara con `build/`; sale con código ≠ 0 si difiere.

### 5.2 Primitivos de color (de la referencia, sin metadatos de extracción)

`slate-dark #141413` · `slate-medium #3d3d3a` · `ivory-medium #f0eee6` · `ivory-light #faf9f5` · `oat-warm #e3dacc` · `manilla #f5e3c7` · `stone #cccbc8` · `cloud-medium #b0aea5` · `cloud-dark #87867f` · `clay #d97757` · `clay-deep #c6613f`.
**Primitivos derivados (congelados en v1; contrastes calculados por el coordinador, el script de 1.B los re-verifica):**

| Token | Valor | Para qué | Contraste |
| --- | --- | --- | --- |
| `slate-soft` | `#5e5d59` | `text-muted` claro | ≥ 4,76:1 sobre canvas, surface, feature y deep |
| `slate-raised` | `#1f1f1d` | `surface` oscuro | `ivory-light` encima: 15,7:1 |
| `manilla-night` | `#3a3226` | `surface-feature` oscuro | `ivory-light` encima: 12,0:1 |
| `ochre` / `ochre-light` | `#a8741a` / `#d4a24a` | datos 3 (claro / oscuro) | 3,85:1 / 7,13:1 |
| `olive` / `olive-light` | `#66742f` / `#9aab5c` | datos 4 | 4,86:1 / 6,57:1 |
| `taupe` / `taupe-light` | `#8a6a55` / `#b89580` | datos 5 | 4,66:1 / 6,01:1 |
| `sage` / `sage-light` | `#6f8266` / `#9db08f` | datos 6 | 3,94:1 / 7,11:1 |

Contrastes de datos medidos contra `surface` de cada tema. `text-muted` oscuro reutiliza `cloud-medium` (`#b0aea5`: ≥ 4,9:1 sobre las cuatro superficies oscuras).

### 5.3 Tokens semánticos (claves obligatorias en cada tema)

| Token | Claro | Oscuro |
| --- | --- | --- |
| `--ds-canvas` | ivory-medium | slate-dark |
| `--ds-surface` | ivory-light | slate-raised |
| `--ds-surface-feature` | manilla | manilla-night |
| `--ds-surface-deep` | oat-warm | slate-medium |
| `--ds-surface-inverse` | slate-dark | ivory-light |
| `--ds-text` | slate-dark | ivory-light |
| `--ds-text-muted` | slate-soft | cloud-medium |
| `--ds-text-inverse` | ivory-light | slate-dark |
| `--ds-border` | stone | slate-medium |
| `--ds-border-strong` | cloud-dark | cloud-dark |
| `--ds-accent` / `--ds-accent-hover` | clay / clay-deep | clay / clay-deep |
| `--ds-on-accent` | slate-dark | slate-dark |
| `--ds-focus-ring` | slate-dark | ivory-light |
| `--ds-data-1…6` | clay-deep · slate-dark · ochre · olive · taupe · sage | clay · ivory-light · ochre-light · olive-light · taupe-light · sage-light |

### 5.4 Roles tipográficos

| Rol | Familia | Tamaño / peso / interlineado | Tracking | Uso |
| --- | --- | --- | --- | --- |
| `display` | serif | 68 / 400 / 1.1 (fluido) | 0 | Titular editorial |
| `heading` | sans | 61 / 700 / 1.1 (fluido) | 0 | Titular declarativo |
| `subheading-serif` | serif | 24 / 400 / 1.4 | 0 | Subtítulo de sección |
| `subheading-sans` | sans | 24 / 600 / 1.3 | 0 | Subtítulo de UI |
| `title` | sans | 20 / 700 / 1.3 | 0 | Título de card |
| `body` | serif | 20 / 400 / 1.4 | 0 | Cuerpo principal |
| `body-strong` | serif | 18 / 600 / 1.4 | 0 | Énfasis |
| `body-lg` | serif | 18 / 400 / 1.4 | 0 | Cuerpo intermedio |
| `body-sm` | serif | 14 / 400 / 1.43 | 0 | Texto secundario |
| `ui` | sans | 16 / 400 / 1.4 | 0 | Controles |
| `ui-medium` | sans | 16 / 500 / 1.4 | 0 | Controles con énfasis |
| `ui-strong` | sans | 16 / 600 / 1.4 | 0 | Botones |
| `ui-sm` | sans | 15 / 400 / 1.4 | −0.002em | Navegación |
| `ui-single` | sans | 15–16 / 400 / **1.0** | −0.005em | **Solo una línea** (botones, nav) |
| `caption` | sans | 12 / 400 / 1.4 | −0.02em | Pies |
| `caption-medium` | sans | 12 / 500 / 1.4 | 0 | Badges |
| `label` | sans | 12 / 400 / 1.25 | 0 | Etiquetas densas |
| `code` | mono | 16 / 400 / 1.4 | 0 | Código |

Mínimos fluidos propuestos: display 40 px, heading 36 px (a validar en capturas a 360 px).

### 5.5 Forma, espacio y layout

- Spacing: 4/8/12/16/24/32/76/100 + unidad 4. Radios: 0, 8, 12, 16, 24.
- Radios por componente (capa semántica): card 24 · botón relleno = solo esquinas inferiores 8 (superiores 0) · botón con borde 12 · badge 0 · nav 0.
- Layout: `--ds-page-max-width: 1280px` · `--ds-prose-max-width: 880px` (infografía) · `--ds-section-gap: clamp(80px, 10vw, 120px)` · `--ds-card-padding: clamp(24px, 3vw, 32px)` · `--ds-element-gap: 8px`.

## 6. Plan por oleadas

Cada tarea sigue el contrato de `orchestration`: **Target · Change · Constraints · Ownership · Aceptación observable**. Ejecutan workers `pi` (gpt-6-luna); **Sonnet 5.5 revisa cada entrega** antes de aceptarla (ver §8). Las tareas de una misma oleada no comparten ficheros.

### Oleada 0 — Fundamentos (coordinador, sin workers)

- [x] **0.1** Resolver D1, D2, D4, D5 y confirmar D7–D9.
- [x] **0.2** Reescribir `FUNCTIONAL_SPEC.md` §6 (visión del DS, tokens, componentes, estructura) y §11/§12/§13 según este plan.
- [x] **0.3** Retirados `design-system/tokens.css`, `themes.css` y `components.css` de la oleada 1.
- [x] **0.4** Esqueleto de carpetas (§4, con `.gitkeep`) y alias `@ds/*` en `tsconfig.json`; `tsc` y `lint` limpios.
- [x] **0.5** Contrato (§5) congelado como **v1** (2026-10-30), con valores derivados y datos incluidos.

**Hecho ya:** fuentes (Geist, Geist Mono, Source Serif 4) en `design-system/fonts/` con licencias y `fonts.css`; script de sincronización a `public/fonts/`; limpieza de las fuentes antiguas.

### Oleada 1 — Tokens, contraste, fuentes en la app

| Tarea | Target | Entregable | Aceptación |
| --- | --- | --- | --- |
| **1.A** Tokens + generador | `design-system/tokens/**`, `scripts/build-tokens.mjs`, `package.json` (scripts) | JSON limpios (sin `$extensions` de extracción ni nombres `anthropic-*`), generador, CSS en `build/`, `pnpm tokens:build` y `pnpm tokens:check`, enganchado a `predev`/`prebuild` | `tokens:check` limpio · fallo demostrado con un alias roto y con un valor inválido (`80-120px`) · `pnpm lint` y `tsc` limpios |
| **1.B** Contraste | `scripts/check-contrast.mjs`, `design-system/reports/contrast.md` | Informe de todos los pares texto/fondo y componente/fondo, claro y oscuro, con ratio y veredicto AA | Informe generado y reproducible · los tonos derivados (`text-muted`, tema oscuro) lo cumplen · sale con código ≠ 0 si algo falla |
| **1.C** Fuentes en la app | `src/app/layout.tsx`, `src/app/globals.css` | Quitar `next/font/google` (Geist), importar `tokens/build/*` y `fonts/fonts.css`, precargar serif y sans, base global (`canvas`, `text`, `body`) | Sin peticiones externas a Google · captura del login en claro y oscuro · lint/tsc limpios |

Dependencias: 1.B y 1.C requieren el formato de 1.A; se lanzan cuando 1.A pasa revisión.
Salida de la oleada: **informe de contraste y capturas** revisados por el propietario (aprobación del tema oscuro, D4).

### Oleada 2 — Primitivas UI y catálogo

Antes: scaffold de `/design-system` (coordinador o worker 2.0): ruta privada, selector de tema y de idioma, y un registro de secciones `catalog/sections/*.tsx` (el **registro lo edita solo el coordinador** para evitar conflictos; cada worker entrega su sección).

| Tarea | Componentes | Notas |
| --- | --- | --- |
| **2.A** Texto y acciones | `Text` (variantes = roles tipográficos), `Button` (variantes `accent`, `ivory`, `outline`, `ghost`; relleno con esquinas inferiores 8), `Link` (subrayado persistente), `Badge`, `Icon` (set mínimo: chevron, flecha, cerrar, comprobar, copiar, compartir, borrar) | Solo un `accent` por pantalla se documenta en la ficha |
| **2.B** Superficies y feedback | `Card` (variantes `surface`, `feature`, `deep`, `inverse`), `Divider`, `Spinner`, `Skeleton`, `VisuallyHidden`, `Note` | Sin sombras; los radios vienen del token de card |
| **2.C** Formularios | `Label`, `Field` (etiqueta + control + ayuda + error), `Input`, `Textarea` (base), `Select`, `Checkbox`/`Switch`, `Dialog` (base, accesible, foco atrapado) | Estados: normal, hover, foco, deshabilitado, error |

Cada tarea entrega también: ficha `design-system/components/<nombre>.md`, sección de catálogo (todas las variantes y estados × claro/oscuro) y accesibilidad (roles ARIA, teclado).
Aceptación común: lint/tsc, **captura del catálogo en claro y oscuro** a 360 px y 1280 px, sin literales de color (`grep` vacío), sin sombras ni degradados (`grep`), `check-contrast` sin regresiones.

### Oleada 3 — Composites

**Decisiones tomadas (2026-10-30):** (1) `AppHeader` se integra en la app real ahora, sustituyendo `src/components/header.tsx`, con un restyle mínimo del login; (2) el `PromptComposer` muestra el texto y el botón Generar, y pliega título, URL de origen, tema e idioma de salida en un bloque "Opciones"; (3) la miniatura de `InfographicCard` es un hueco (`thumbnail: ReactNode`) que rellena la biblioteca en M2.

Los composites **solo componen primitivas** de `design-system/ui/` (ya se pueden importar, vía `../../primitives/<Nombre>` o `@ds/ui`), no llevan textos propios (strings, valores y callbacks por props) y siguen las reglas de §3. Carpeta: `design-system/ui/composites/<Nombre>/` (misma estructura que las primitivas) y ficha en `design-system/components/<Nombre>.md`.

| Tarea | Componentes | Descripción |
| --- | --- | --- |
| **3.A** | `PromptComposer` | Textarea grande con contador y aviso al pasar ~30.000 caracteres (GEN-11), bloque plegable "Opciones" (título, URL de origen, tema, idioma de salida original/ES/EN, GEN-02/03) y botón Generar (único `accent`). Estados: vacío (envío bloqueado), listo, enviando (Spinner), error. Contador con `aria-live="polite"` |
| **3.B** | `AppHeader`, `LanguageToggle`, `UserMenu` | Cabecera con navegación, toggle ES/EN y menú de sesión (nativo: `popover`/`details`, teclado y Escape). Integración en la app: `layout.tsx` y wrappers en `src/components/` que pasan textos de `messages/` y conservan la cookie `locale`; restyle mínimo del login con `Button`. Retirar `header.tsx` y `language-toggle.tsx` antiguos |
| **3.C** | `InfographicCard`, `SearchBar`, `FilterBar` | Tarjeta de biblioteca (SRCH-05: título, resumen, etiquetas, fecha, banderas ES/EN, indicador de compartida, hueco de miniatura); buscador; filtros (etiqueta, fecha, idioma, compartidas; SRCH-04) |
| **3.D** | `ConfirmDialog`, `ShareDialog` | Sobre el `Dialog` existente. Confirmación de borrado (LIB-05). Compartir: crear/copiar/revocar enlace, caducidad (nunca/7/30 días) e idioma por defecto (SHR-01 a SHR-06); copiar con `navigator.clipboard` y estado "copiado" |
| **3.E** | `GenerationProgress`, `EmptyState`, `ErrorState` | Progreso de 4 pasos (analizando, componiendo, validando, guardando; GEN-04) con estados pendiente/activo/hecho/error; estados vacío y de error con acción "Reintentar" |
| **3.F** | Secciones del catálogo | Una sección por grupo (`CatalogSection` en `design-system/catalog/sections/`), todos los estados en claro/oscuro y ES/EN; el registro lo edita solo el coordinador |

Orden: 3.A a 3.E en paralelo (archivos disjuntos, tareas de 2–3 componentes como máximo) → 3.F → pruebas de comportamiento en navegador (contador y límite del `PromptComposer`, copiar enlace en `ShareDialog`, teclado y Escape en `UserMenu`; herramientas en `scripts/dev/`) → revisión con capturas propias → **aprobación del propietario del `PromptComposer`**.

Aceptación: la de la Oleada 2 (lint, typecheck, `tokens:check`, `contrast:check`, greps de reglas, líneas ≤ 100, capturas a 360 y 1280 px en ambos temas revisadas por el coordinador), más una prueba de comportamiento por composite interactivo.

### Oleada 4 — Capa de infografía

| Tarea | Entregable |
| --- | --- |
| **4.A** CSS `ig-*` | Reescritura de los 12 componentes ★ con la estética nueva (serif de cuerpo, cards de 24 px, `verdict` sobre `surface-inverse`, datos con `--ds-data-*`), sin literales de color |
| **4.B** `manifest.ts` + `validate.ts` | Vocabulario permitido (clases, variantes, `--ig-*`) y validador de §5.5 de la spec (allowlist de etiquetas/atributos, sin `<script>`/`<style>`/`on*`/URLs externas, `style` solo con `--ig-*`) con una batería de casos válidos e inválidos como fixtures |
| **4.C** `render.ts` | `buildDocument(fragmento, { locale, theme, dsVersion, embed })`: documento completo para el iframe y `.html` autocontenido con CSS y fuentes en base64 |
| **4.D** `examples/` + fichas | La infografía de referencia reescrita (ES y EN) y fichas `.md` de cada componente `ig-*` |
| **4.E** Catálogo de infografía | Sección en `/design-system` con cada componente `ig-*` en ambos temas e idiomas, renderizado dentro de `<iframe sandbox srcdoc>` |

Dependencias: 4.A → (4.B, 4.C, 4.D) → 4.E.
Nota: `agent/skills/design-system.md` (generada desde el manifiesto) se deja para M3.

### Oleada 5 — Verificación E2E y cierre de M1

- [ ] **5.A** Instalar Playwright y configurar informes (HTML + trazas) como artefacto repetible.
- [ ] **5.B** E2E: rechazo de cuentas no propietarias por el hook de la allowlist (arrastre de M0).
- [ ] **5.C** E2E: login y protección de rutas (arrastre de M0).
- [ ] **5.D** E2E/visual: el catálogo `/design-system` renderiza todos los componentes en ambos temas sin errores de consola; capturas de referencia.
- [ ] **5.E** `CHANGELOG.md` del DS con la versión `1.0.0`; marcar M1 en la spec.

## 7. Cómo delegar (plantilla de comandos)

```bash
orca orchestration run-create --objective "<oleada y objetivo>" --json
orca orchestration worker-start --spec "$SPEC" --task-title "<título>" \
  --worktree current --agent pi --json     # pi usa gpt-6-luna por su config
orca orchestration check --wait --types "worker_done,escalation,question" --timeout-ms 600000 --json
# tras revisar: ack del delivery y worker-release del dispatch
```

Plantilla de `SPEC` (obligatoria en todas las tareas):

```text
Repo: Next.js 16 (pnpm), worktree actual. Lee antes: DESIGN_SYSTEM_PLAN.md §3 y §5, y los docs de Next 16 en
node_modules/next/dist/docs si tocas Next.
TARGET: <ficheros exactos que puede crear/editar>
CHANGE: <resultado concreto>
CONSTRAINTS: <reglas de §3 que aplican> + no tocar nada fuera de TARGET + sin dependencias nuevas + sin commit
OWNERSHIP: <qué ficheros son suyos; qué ficheros son de otro worker>
ACCEPTANCE (pegar salida real): <comandos y evidencias>
Si un paso falla: reporta el error exacto y detente; no lo rodees en silencio.
```

Notas aprendidas en la oleada 1 y las fuentes:

- Dar al worker **URLs, rutas y valores exactos**; no pedirle descubrimiento si ya está resuelto.
- Si un worker falla con `terminal_not_writable` en `dispatch_input`, reintentar con `--retry-of` y terminal nuevo (no se envió nada).
- `tsc` necesita `pnpm next typegen` antes (tipos generados de rutas); ver 1.A para engancharlo.

## 8. Revisión (responsabilidad de Sonnet 5.5)

Checklist por entrega, antes de aceptar y de lanzar la siguiente oleada:

1. **Diff acotado:** solo se tocaron los ficheros del TARGET.
2. **Reglas duras (§3):** `grep` sin literales de color fuera de primitivos, sin `box-shadow`, sin `gradient` (salvo el rayado de barras proyectadas, permitido y documentado), sin `!important`.
3. **Contraste:** `check-contrast` ejecutado por mí, no solo el informe del worker.
4. **Lint y tipos:** `pnpm tokens:check`, `pnpm lint`, `pnpm next typegen && pnpm tsc --noEmit`, con salida pegada.
5. **Visual:** capturas propias en claro/oscuro a 360 y 1280 px (Chrome headless sobre el catálogo) y lectura de las imágenes.
6. **Accesibilidad básica:** foco visible, roles, teclado en `Dialog`/`Select`, valores siempre como texto.
7. **API de componentes:** variantes explícitas, `ref` como prop, sin strings propios, sin props booleanas de estilo.
8. **Veredicto por tarea:** aceptada · corrección (reenvío al mismo terminal o `--retry-of`) · rechazada. Se registra en la tabla de seguimiento.

El propietario aprueba explícitamente: tema oscuro (**aprobado 2026-10-30**), primer catálogo (**aprobado 2026-10-30**) y `PromptComposer` (fin Oleada 3).

## 9. Seguimiento

| Tarea | Estado | Worker | Revisión | Notas |
| --- | --- | --- | --- | --- |
| Fuentes | [x] | pi (+ coordinador: `fonts.css`) | Aceptada | Geist, Geist Mono, Source Serif 4 (opsz+wght, 122 KB) |
| 0.1–0.2 | [x] | coordinador | — | Spec §6 reescrita; §3, §9, §11, §12 y §13 alineadas |
| 0.3–0.5 | [x] | coordinador | — | CSS de la oleada 1 retirado, esqueleto y alias `@ds/*`, contrato v1 congelado |
| 1.A Tokens + generador | [x] | pi/gpt-6-luna (3 envíos) | Aceptada | Reprodujo 5 negativos; refactor de legibilidad y errores limpios; CSS generado idéntico |
| 1.B Contraste | [x] | pi/gpt-6-luna | Aceptada | 56 pares pasan; ratios verificados con cálculo independiente; prueba negativa hecha por el coordinador en copia aislada |
| 1.C Fuentes en app | [x] | pi/gpt-6-luna | Aceptada con correcciones | Corregido `page.module.css` (fondo de tarjeta) y `.eve/**` en ESLint; capturas con etiquetas claro/oscuro invertidas |
| 2.0 Scaffold catálogo | [x] | coordinador + pi (2T) | Aceptada | Esqueleto y sección de tokens (leída de los JSON); captura propia revisada |
| 2.A Texto y acciones | [x] | pi/gpt-6-luna (2A, 2A1, 2A2, 2A3, 2F) | Aceptada con correcciones | `Button` gana `tone="inverse"` (outline/ghost invisibles en fondo oscuro); `Text` tipado polimórfico corregido por el coordinador |
| 2.B Superficies y feedback | [x] | pi/gpt-6-luna (2B, 2B2, 2F) | Aceptada con correcciones | `Card` tipado corregido por el coordinador; catálogo reescrito |
| 2.C Formularios | [x] | pi/gpt-6-luna (2C, 2C2, 2C3, 2C4, 2G) | Aceptada con correcciones | `Dialog` corregido por el coordinador (Escape llamaba dos veces a `onClose`; clic en el relleno cerraba). Verificado en navegador 12/12 |
| 3.A PromptComposer | [x] | pi/gpt-6-luna | Aceptada; **aprobada por el propietario (2026-10-30)** | Prueba en navegador 22/22 (contador, aviso >30000, Opciones, envío). Puerta humana |
| 3.B AppHeader | [x] | pi/gpt-6-luna (3.B1, 3.B2) | Aceptada con correcciones | `LanguageToggle` sin fuente sans y a ancho completo, y ancla CSS compartida de `UserMenu`, corregidos por el coordinador. Integrado en `layout.tsx`; `header.tsx` y `language-toggle.tsx` retirados. Verificado solo sin sesión real (cabecera con sesión cubierta por el catálogo) |
| 3.C Biblioteca | [x] | pi/gpt-6-luna (3.C1, 3.C2) | Aceptada con correcciones | Botón Buscar vacío en 360 px, etiqueta «Compartida» en serif y espaciado de la tarjeta corregidos por el coordinador |
| 3.D ConfirmDialog y ShareDialog | [x] | pi/gpt-6-luna | Aceptada | Copiar enlace verificado con portapapeles real; `index.ts` sin tipos corregido por el coordinador |
| 3.E Progreso y estados | [x] | pi/gpt-6-luna | Aceptada con correcciones | Texto de pasos en serif y botón `ivory` invisible sobre superficie (ErrorState pasa a `outline`) corregidos por el coordinador |
| 3.F Catálogo de composites | [x] | pi/gpt-6-luna (3.F1–3.F5) | Aceptada con correcciones | 5 secciones; pies de foto y demo de búsqueda corregidos. Capturas 360/1280 claro/oscuro revisadas; `scripts/dev/composites-test.mjs` |
| 4.A CSS `ig-*` | [x] | pi/gpt-6-luna (4.A1–4.A4) | Aceptada con correcciones | 12 componentes en `design-system/infographic/css/` + `base.css` (coordinador) y `components.css` (imports). Corregido por el coordinador: los resets de `base.css` ganaban por especificidad a las clases de componente (ahora con `:where()`). Revisado a 360/1280 claro/oscuro. Sin rayado en `--projected` (prohibido gradient): borde discontinuo |
| 4.B `manifest.ts` + `validate.ts` | [x] | pi/gpt-6-luna (4.B1, 4.B2, 4.F) | Aceptada con correcciones | Tokenizador estricto propio (sin dependencias). 59 fixtures (`scripts/dev/validate-test.ts`). El coordinador encontró y corrigió un hueco: caracteres de control y bidi dentro de texto/atributos pasaban (solo se miraba el primer carácter de cada tramo); añadidos 3 fixtures |
| 4.C `render.ts` | [x] | pi/gpt-6-luna | Aceptada con correcciones | Autocontenido 256 KB, iframe 29 KB (`scripts/dev/render-test.ts`). Corregido: `fontBaseUrl` se interpolaba sin validar en el CSS; líneas >100 |
| 4.D `examples/` + fichas | [x] | pi/gpt-6-luna (4.D1a, 4.D1b, 4.D2) | Aceptada con correcciones | 12 fichas `ig-*.md`; `pensiones.es/en.html` (datos ilustrativos, 43 comprobaciones en `examples-check.ts`). El valor de `ig-bar-chart` pasa a una pastilla `--ds-surface` (el texto sobre `--ds-data-*` fallaba AA: hasta 2,20:1 en oscuro) |
| 4.E Catálogo de infografía | [x] | pi/gpt-6-luna (4.E1, 4.E2) + coordinador | Aceptada con correcciones | Sección «Infografía» en `/design-system`: ejemplo completo + 12 muestras (`samples.ts`) en `<iframe sandbox="allow-same-origin">` (sin scripts; solo para medir la altura) con `srcdoc` compuesto en el cliente por `document.ts` (el CSS viaja una vez). Comprobado en navegador: tema, idioma y ancho móvil. Vía de producción (sandbox estricto + fuentes base64) comprobada aparte. Corregido por el coordinador: medición de altura (el `load` ocurre antes de hidratar), muestras con hermanos en la raíz y `ig-options` con un solo item |
| 5.A–5.E E2E y cierre | [ ] | | | |

### Lecciones de la Oleada 2 (para las siguientes)

- Los workers `pi`/luna se detienen tras 4–6 archivos: tareas de **2–3 componentes** como máximo, y la sección del catálogo aparte.
- Dar **rangos de lectura** (`sed -n 'a,bp'`) para los documentos de referencia; leerlos enteros se trunca.
- Para tipos polimórficos con `as`: `const Component = as as ElementType;` (con anotación de tipo, TypeScript estrecha el tipo y sigue fallando).
- Los workers informan "sin fallos visuales" aunque haya defectos: la revisión con capturas propias es imprescindible. Herramientas de revisión (fuera del repo): captura por CDP con cookie falsa y test de comportamiento del `Dialog`.
- Un único servidor de desarrollo compartido evita choques en `.next`.

### Lecciones de la Oleada 3

- El catálogo se divide en dos rutas: `/design-system` (fundamentos: tokens) y `/components` (todas las secciones de componentes). Registro en `design-system/catalog/registry.ts` (`foundationSections` y `componentSections`); las páginas usan los wrappers cliente de `Catalogs.tsx` porque las secciones son funciones y no cruzan la frontera servidor→cliente.
- Los workers pi entregaron 11 tareas sin bloqueos; los defectos fueron siempre visuales o de integración, nunca de tipos: `composes` de clases globales no funciona en CSS Modules (usar tokens), botones `ivory` sobre superficies `--ds-surface` se ven como texto (usar `outline`), `index.ts` sin reexportar todos los tipos, `anchor-name` fijo compartido entre instancias, pies de foto copiados entre demos.
- Un worker corrigió un fichero ajeno a su TARGET para desbloquear su typecheck: revisar el diff completo, no solo el TARGET.
- `shoot.mjs --selector=#id` recorta una sección del catálogo y avisa de desbordamiento horizontal.

## 10. Riesgos abiertos

- **Paleta de datos cálida (D2):** pocos tonos distinguibles en la familia tierra; riesgo de gráficos poco legibles o con poco contraste. Mitigación: validar `--ds-data-*` con el script de contraste y sobre capturas de ejemplos reales.
- ~~Tema oscuro derivado~~ (aprobado el 2026-10-30; la referencia no define uno, se revisará si aparecen problemas en pantallas reales).
- **Peso de la fuente serif en exportación:** ~122 KB (≈ 165 KB en base64). Si pesa demasiado, versión solo `wght` (51 KB).
- **Copyright de Source Serif 4:** el paquete de Fontsource trae "Google Inc."; revisar si se quiere citar a Adobe en una página de créditos.
- **Fluid type:** los mínimos de display/heading pueden rozar en 360 px con títulos largos en español.
- **`@font-face` con URL absoluta `/fonts/...`:** el render en `iframe srcdoc` y el `.html` exportado necesitan resolverla (origen en el primero, base64 en el segundo). Cubierto por 4.C; probar pronto.
- **Regresión visual:** hasta tener Playwright (5.A), las comprobaciones visuales son manuales con capturas.
