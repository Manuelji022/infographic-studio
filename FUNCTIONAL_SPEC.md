# Infographic Studio — Functional Spec

> Estado: **borrador v0.9** · Última actualización: 2026-10-29
> Documento principal del repositorio. Cualquier cambio de alcance o comportamiento debe reflejarse aquí primero.

---

## 1. Visión

Infographic Studio es una herramienta personal que convierte un artículo o texto libre en una **infografía en HTML + CSS vanilla**. Un agente de IA lee el texto, identifica los datos y las ideas clave, decide qué visualizaciones encajan y compone la infografía **usando un design system propio**. El HTML se valida de forma determinista, se guarda en PostgreSQL y la aplicación Next.js lo consume para mostrarlo, buscarlo y compartirlo.

La interfaz está **en español por defecto**, con un **toggle para cambiar a inglés**. Cada infografía se genera **en el idioma del texto original** y se puede **traducir** al otro idioma cuando se quiera.

### 1.1 Objetivos

- Pasar de "texto largo" a "infografía legible" en un solo paso, sin diseñar a mano.
- **Consistencia visual:** todas las infografías comparten un mismo lenguaje visual gracias al design system (§6).
- **Portabilidad:** cada infografía se puede exportar como un `.html` autocontenido, sin JavaScript ni dependencias externas.
- **Biblioteca privada** con búsqueda rápida y **compartir** infografías concretas mediante enlace.
- **Bilingüe ES/EN:** interfaz e infografías en los dos idiomas (§4.5).

### 1.2 No-objetivos (fuera de alcance en v1)

- Multiusuario, roles o cuentas para terceros. Solo existe el propietario.
- Editor visual WYSIWYG de la infografía.
- Infografías interactivas con JavaScript.
- Ingesta automática desde URL (scraping). En v1 el texto se pega manualmente.
- Idiomas distintos de español e inglés.
- Exportación a PNG/PDF (candidato para v2).

---

## 2. Usuarios y acceso

| Actor | Qué puede hacer |
| --- | --- |
| **Propietario** (único usuario autenticado) | Todo: generar, ver la biblioteca completa, buscar, editar metadatos, traducir, eliminar, compartir y revocar. |
| **Invitado** (cualquiera con un enlace compartido) | Ver **solo** la infografía de ese enlace, en modo lectura y en los idiomas disponibles. No ve la biblioteca, ni el texto original, ni otras infografías. No necesita cuenta. |

- Toda la aplicación y las rutas del agente (`/eve/v1/*`) exigen la sesión del propietario.
- La única excepción pública es la ruta de enlaces compartidos `/s/[token]` (§4.4).

---

## 3. Arquitectura general

```text
┌──────────────────────── Next.js 16 · Vercel ─────────────────────────┐
│  proxy.ts → exige sesión del propietario salvo en /s/* y /api/auth/* │
│                                                                      │
│  /              Generar          (privado)                           │
│  /library       Biblioteca       (privado)                           │
│  /i/[id]        Detalle          (privado)                           │
│  /design-system Catálogo vivo    (privado)                           │
│  /s/[token]     Vista compartida (público, solo lectura)             │
│                                                                      │
│  Toggle ES/EN (cookie `locale`) · Better Auth (/api/auth/*)          │
│  useEveAgent ──► /eve/v1/*  (withEve, mismo origen)                  │
└──────────────┬──────────────────────────────────────┬────────────────┘
               │                                      │ lee (Drizzle)
     ┌─────────▼──────────┐   save_infographic   ┌────▼─────────────┐
     │  Agente eve        │ ───────────────────► │  PostgreSQL      │
     │  agent/            │   valida + inserta   │  (Neon, Vercel   │
     │  tools · skills    │      (Drizzle)       │   Marketplace)   │
     └─────────┬──────────┘                      └──────────────────┘
               │ usa
     ┌─────────▼──────────┐
     │  design-system/    │ ◄── también lo importa Next.js para renderizar
     └────────────────────┘
```

| Pieza | Tecnología | Responsabilidad |
| --- | --- | --- |
| Frontend | Next.js 16 (App Router), React 19 | UI de generación, biblioteca, búsqueda, compartir, render de infografías e i18n |
| Agente | `eve`, en `agent/` (raíz del repo) | Analizar el texto, componer la infografía con el design system, traducirla y guardarla |
| Design system | `design-system/` (CSS + catálogo de componentes) | Fuente única del lenguaje visual, compartida por el agente y la app |
| Persistencia | PostgreSQL (Neon vía Vercel Marketplace) + **Drizzle ORM** | Infografías, contenidos por idioma, enlaces compartidos, tablas de auth e índice de búsqueda |
| Auth | **Better Auth** (adaptador de Drizzle), restringido al email del propietario | Proteger la app y el canal del agente |
| Despliegue | Vercel: app y agente en el mismo proyecto (`withEve`) | |

### 3.1 Flujo de guardado: el agente valida y sube

1. El usuario pega el texto en `/` y lo envía al agente. Por defecto, el idioma de salida es el del texto original (GEN-03).
2. El agente analiza el texto y compone la infografía con componentes del design system.
3. El agente llama a la tool **`save_infographic`**. La tool:
   - valida la entrada con **código determinista**, no con el criterio del modelo (schema Zod + reglas de §5.5);
   - si hay errores, **los devuelve al agente**, que corrige el HTML y lo vuelve a intentar (máx. 3 intentos);
   - si todo es válido, inserta la infografía en PostgreSQL con estado `draft` y devuelve su `id`.
4. El frontend recibe el `id` por el stream y muestra la infografía leyéndola de la BD.
5. El usuario la revisa: **Conservar** (pasa a `saved`), **Refinar** (nueva versión en la misma sesión) o **Descartar** (se borra).

**Por qué así:** si la validación vive en una tool, el agente se autocorrige antes de que veas un resultado roto. Y la BD queda como la única fuente de verdad que consume Next.js. Los borradores que no se conservan se limpian solos a los 7 días (cron de Vercel).

**Requisito técnico:** la tool del agente y la app de Next comparten `DATABASE_URL` y el módulo `db/` (schema de Drizzle y validador). Eve queda fuera de M0: en M3 hay que comprobar que el build de eve puede importar módulos de fuera de `agent/`. Si no puede, esos módulos se mueven a `agent/lib/` y la app los importa desde ahí.

---

## 4. Funcionalidades

Prioridad: **P0** = imprescindible para v1 · **P1** = deseable en v1 · **P2** = futuro.

### 4.1 Generación

| ID | Requisito | Prio |
| --- | --- | --- |
| GEN-01 | El usuario puede pegar un texto (artículo, informe, notas) en un área de texto. | P0 |
| GEN-02 | Opcionalmente indica título, URL de origen y tema visual del design system. Si no, el agente los infiere. | P1 |
| GEN-03 | Por defecto, la infografía se genera **en el idioma del texto original** (ES o EN), detectado por el agente. Un selector opcional "Idioma de salida: original / ES / EN" permite forzar otro. El toggle de la interfaz no influye. | P0 |
| GEN-03b | Si el texto original no está en español ni en inglés, la salida es en español, salvo que el selector diga otra cosa. | P1 |
| GEN-04 | Al pulsar **Generar**, la UI muestra el progreso del stream (analizando, componiendo, validando, guardando). | P0 |
| GEN-05 | El agente identifica los **datos clave** (cifras, porcentajes, fechas, comparaciones, rankings) y los **mensajes principales**. | P0 |
| GEN-06 | El agente compone la infografía **solo** con componentes del design system (§6). | P0 |
| GEN-07 | El agente guarda el resultado mediante `save_infographic` tras pasar la validación (§3.1). | P0 |
| GEN-08 | La previsualización se renderiza aislada en `<iframe sandbox srcdoc>`, sin `allow-scripts`. | P0 |
| GEN-09 | **Refinar** con una instrucción ("más compacta", "tema oscuro", "añade la cifra de 2023") reutiliza la sesión de eve y crea una nueva versión. | P1 |
| GEN-10 | Si el texto no tiene datos cuantitativos, el agente lo avisa y crea una infografía de ideas clave **sin inventar cifras**. | P0 |
| GEN-11 | Límite de entrada orientativo de ~30.000 caracteres; la UI avisa antes de enviar. | P1 |

### 4.2 Biblioteca y gestión

| ID | Requisito | Prio |
| --- | --- | --- |
| LIB-01 | Conservar, refinar o descartar el borrador recién generado. | P0 |
| LIB-02 | Editar título y etiquetas propuestas por el agente. | P1 |
| LIB-03 | Detalle `/i/[id]`: infografía grande, metadatos, datos clave, texto original plegable, idiomas disponibles y estado de compartición. | P0 |
| LIB-04 | Acciones: **descargar `.html`** (autocontenido, con el CSS del design system incrustado, en el idioma activo), **copiar HTML**, **eliminar**. | P0 |
| LIB-05 | Eliminar pide confirmación y revoca los enlaces compartidos. | P0 |
| LIB-06 | Historial de versiones de una infografía refinada. | P2 |

### 4.3 Búsqueda

| ID | Requisito | Prio |
| --- | --- | --- |
| SRCH-01 | En `/library`, un buscador filtra las infografías guardadas (`saved`). | P0 |
| SRCH-02 | Full-text con `tsvector` y `ts_rank` sobre título, etiquetas, resumen y texto original, **en cualquiera de los dos idiomas**: buscar "pensions" encuentra una infografía en español si tiene versión en inglés. | P0 |
| SRCH-03 | Tolerancia a errores tipográficos con `pg_trgm` sobre el título. | P1 |
| SRCH-04 | Filtros por etiqueta, rango de fechas, idioma y "compartidas". Orden por relevancia o por fecha. | P1 |
| SRCH-05 | Rejilla de tarjetas: título y resumen en el idioma del toggle (si no existe, en el original), etiquetas, fecha, banderas ES/EN disponibles, indicador de compartida y miniatura. | P0 |
| SRCH-06 | El estado de la búsqueda vive en la URL (`/library?q=…&tag=…`). | P1 |
| SRCH-07 | Búsqueda semántica con `pgvector`. | P2 |

### 4.4 Compartir

| ID | Requisito | Prio |
| --- | --- | --- |
| SHR-01 | Desde el detalle, **Compartir** genera un enlace público `https://<dominio>/s/<token>`, con un token aleatorio de ≥ 128 bits (no se puede adivinar ni enumerar). | P0 |
| SHR-02 | La vista `/s/[token]` muestra **solo** la infografía (título y pie con la fuente), en modo lectura y sin login. No expone el texto original, otras infografías ni la navegación de la app. | P0 |
| SHR-03 | Si la infografía existe en los dos idiomas, la vista compartida muestra el toggle ES/EN. El idioma inicial es el de `?lang=` o, si no viene, el del navegador del invitado (`Accept-Language`), con español como respaldo. | P1 |
| SHR-04 | El propietario puede **revocar** el enlace en cualquier momento; a partir de ahí devuelve 404. | P0 |
| SHR-05 | Caducidad opcional: nunca, 7 días o 30 días. | P1 |
| SHR-06 | Botón "Copiar enlace" (con opción de fijar el idioma en el enlace) y uso de la Web Share API en móvil. | P1 |
| SHR-07 | Las páginas compartidas llevan `noindex` y no aparecen en buscadores. | P0 |
| SHR-08 | Metadatos Open Graph (título y resumen en el idioma del enlace) para que se vea bien en WhatsApp, Telegram, etc. | P1 |
| SHR-09 | Imagen OG generada a partir de la infografía. | P2 |
| SHR-10 | Contador de visitas por enlace. | P2 |

### 4.5 Idioma (ES/EN)

| ID | Requisito | Prio |
| --- | --- | --- |
| I18N-01 | Toda la interfaz está disponible en español (por defecto) e inglés. | P0 |
| I18N-02 | Un **toggle ES/EN** visible en la cabecera de la app cambia el idioma al instante, sin recargar ni cambiar de URL. La preferencia se guarda en una cookie `locale`. | P0 |
| I18N-03 | Los textos de la interfaz viven en diccionarios tipados (`messages/es.ts`, `messages/en.ts`). Si falta una clave en inglés, el build falla. | P0 |
| I18N-04 | El toggle **no** decide el idioma de generación (GEN-03). Solo cambia la interfaz y qué versión se muestra cuando existen las dos. | P0 |
| I18N-05 | Una infografía nace en un idioma y puede tener una segunda versión traducida. Si el toggle pide un idioma que no existe, se muestra la original con un aviso y el botón **"Traducir a inglés / español"**. | P0 |
| I18N-06 | La traducción es **solo bajo demanda**: nunca se traduce automáticamente al generar. **Traducir** pide al agente una versión en el otro idioma a partir de la existente: mismo layout, mismos componentes y mismos datos. Se valida con las mismas reglas (§5.5) y además comprueba que las cifras coinciden con las del original. | P0 |
| I18N-06b | La versión traducida se marca como tal ("Traducido del español") en el detalle y en el pie de la infografía. | P1 |
| I18N-07 | Fechas y números se formatean según el idioma (`27,4 %` / `27.4%`; `1.500` / `1,500`) con `Intl`. En las infografías el agente aplica estas mismas convenciones. | P0 |
| I18N-08 | Las etiquetas (`tags`) se guardan en los dos idiomas cuando hay traducción, para que la búsqueda y los filtros funcionen con cualquier toggle. | P1 |

---

## 5. El agente

### 5.1 Responsabilidades

1. Comprender el texto de entrada (en cualquier idioma).
2. Extraer datos clave **literales**, con su contexto (unidad, fecha, cita del texto que los respalda).
3. Decidir la estructura narrativa: titular → 3-6 bloques → conclusión (ver el patrón de §6.2).
4. Componer el HTML con componentes del design system **en el idioma del original** (o en el forzado por el selector).
5. Validar y guardar con `save_infographic`, corrigiendo si la validación falla.
6. Traducir infografías existentes con `save_translation` (I18N-06).

### 5.2 Organización en `agent/`

| Fichero | Contenido |
| --- | --- |
| `agent.ts` | Modelo y configuración (`defineAgent`). **Modelo: por decidir.** |
| `instructions.md` | Rol, reglas de §5.4, criterios de calidad y convenciones por idioma. |
| `skills/design-system.md` | Catálogo de componentes con su marcado, generado desde `design-system/` (§6.4). |
| `skills/translate.md` | Procedimiento de traducción: conservar estructura y cifras, adaptar formato numérico y tono. |
| `tools/save_infographic.ts` | Valida (§5.5) y persiste una infografía nueva con Drizzle (§3.1). |
| `tools/save_translation.ts` | Valida y añade el contenido en el otro idioma a una infografía existente. |
| `channels/eve.ts` | Auth: verifica la sesión de Better Auth del propietario (+ `localDev()` en local). |
| `evals/` | Casos con textos de ejemplo en ES y EN y aserciones (validación OK, cifras trazables al texto, solo componentes del DS, idioma de salida correcto). |

### 5.3 Entrada de `save_infographic`

```ts
{
  language: "es" | "en";    // idioma de salida (por defecto, el del original)
  sourceLanguage: string;   // idioma detectado del texto original
  title: string;
  summary: string;          // 1-2 frases; para la búsqueda y las tarjetas
  tags: string[];           // 3-6, en minúsculas
  theme: string;            // tema del design system, p. ej. "light"
  keyData: Array<{
    label: string;          // "Paro juvenil"
    value: string;          // "27,4 %"
    context?: string;       // "España, T2 2026"
    sourceQuote: string;    // fragmento literal del texto original (en su idioma)
  }>;
  html: string;             // fragmento con componentes del DS (§6)
  warnings?: string[];
}
```

`save_translation` recibe `infographicId`, `language` y los mismos campos de contenido (`title`, `summary`, `tags`, `keyData`, `html`).

### 5.4 Reglas del HTML generado

- Es un **fragmento**, no un documento completo: el `<html lang>`, el `<head>` y el CSS los pone el renderer (§6.3).
- Solo puede usar elementos HTML y SVG de una allowlist y **clases del design system** (prefijo `ig-`).
- No lleva `<style>` propio. El atributo `style` solo se admite para pasar datos mediante custom properties del DS (`style="--ig-value: 42"`).
- Nunca se inventan datos. Cada número visible debe estar en `keyData` con su `sourceQuote`.
- Pie obligatorio (componente `ig-footer`) con la fuente y la fecha.

### 5.5 Validación (determinista, dentro de la tool)

- Schema Zod de §5.3.
- Parseo del HTML: allowlist de etiquetas y atributos; nada de `<script>`, `<style>`, `on*`, `javascript:` ni URLs externas.
- Todas las clases existen en el manifiesto del design system (§6.4).
- `style` solo contiene custom properties `--ig-*` con valores numéricos o tokens válidos.
- Cada `value` de `keyData` aparece en el HTML, y cada `sourceQuote` aparece en el texto original.
- En traducciones: el número de `keyData` y sus valores numéricos normalizados coinciden con los del original.
- Tamaño máximo del fragmento: 100 KB.

---

## 6. Design system

Es el lenguaje visual común de todas las infografías. Lo consumen el agente, para componerlas, y la app, para renderizarlas y exportarlas.

> **Estilo visual: pendiente.** El propietario aportará la identidad visual definitiva (paleta, tipografía). La **referencia estructural** es el artifact [*Los sacrificios ya están decididos*](https://claude.ai/artifact/D2HeTGpqvoK2jRFPn4YikW), del que salen los componentes y el patrón narrativo de §6.2. Sus colores y fuentes sirven como valores provisionales de los tokens.

### 6.1 Por qué

- **Consistencia:** todas las infografías se reconocen como parte de la misma colección.
- **Calidad:** el agente ensambla piezas ya diseñadas y probadas en lugar de inventar CSS cada vez.
- **Seguridad y validación:** con un vocabulario cerrado de clases, la validación es simple y fiable.
- **Eficiencia:** el HTML generado es más pequeño, se generan menos tokens y es más rápido.
- **Evolución:** un cambio en el DS (paleta, tipografía) mejora todas las infografías, incluidas las antiguas, salvo las que se fijen a una versión.

### 6.2 Contenido

**Patrón narrativo** (tomado de la referencia):

1. `ig-header`: titular contundente que resume la tesis, con entradilla.
2. 3-6 `ig-section`, cada una con un titular que es **una conclusión** ("El peso de las pensiones se ha multiplicado por 2,7"), no un tema ("Gasto en pensiones"). Debajo, una línea que explica qué se mide y en qué unidad.
3. `ig-verdict`: cierre en un bloque de alto contraste con la idea final.
4. `ig-footer`: autor, medio, año y fuentes citadas.

**Estructura de color** (inspirada en la de Geist, con valores propios). Todos los colores salen de **escalas de 10 pasos** (100 → 1000), y los componentes solo usan **tokens semánticos** que apuntan a un paso concreto de una escala. Así, cambiar la paleta no toca los componentes.

**Escalas** (custom properties `--ig-{escala}-{paso}`, p. ej. `--ig-blue-700`):

| Escala | Uso en v1 |
| --- | --- |
| `gray` | Texto, fondos, bordes y divisores (escala principal) |
| `gray-alpha` | Solo sombras y capas que deben dejar ver el fondo |
| `blue` | Dato principal, enlaces y acciones |
| `amber` | Énfasis secundario: proyecciones, "empeora", notas |
| `red` / `green` | Errores y confirmaciones de la app (no de las infografías) |
| `teal`, `purple`, `pink` | Categorías de gráficos (`--ig-cat-*`); valores por definir |

**Uso por paso** (el mismo mapa para todas las escalas no base):

| Paso | Uso |
| --- | --- |
| 100 | Fondo por defecto de componentes |
| 200 | Fondo en hover |
| 300 | Fondo en active |
| 400 | Borde por defecto |
| 500 | Borde en hover |
| 600 | Borde en active |
| 700 | Fondo de alto contraste (barras, cifras destacadas) |
| 800 | Fondo de alto contraste en hover |
| 900 | Texto e iconos secundarios |
| 1000 | Texto e iconos principales |

**Tokens semánticos** (en `themes.css`, por tema):

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--ig-background-1` | `gray-100` | `gray-100` | Fondo de página |
| `--ig-background-2` | `gray-200` | `gray-200` | Fondo secundario, usar con moderación |
| `--ig-surface` | `gray-100` | `gray-300` | Tarjetas (`ig-card`) |
| `--ig-foreground-1` | `gray-1000` | `gray-1000` | Texto principal |
| `--ig-foreground-2` | `gray-900` | `gray-900` | Texto secundario (`--ig-muted`) |
| `--ig-border` | `gray-400` | `gray-400` | Bordes y divisores |
| `--ig-track` | `gray-300` | `gray-400` | Fondo de las barras |
| `--ig-primary` | `blue-700` | `blue-700` | Dato principal |
| `--ig-secondary` | `amber-600` | `amber-600` | Proyección, empeora |
| `--ig-on-primary` | `gray-100` | `gray-100` | Texto sobre `--ig-primary` |

**Valores por defecto de v1** (provisionales; se sustituirán por los que aporte el propietario):

| Escala | Claro 100 → 1000 | Oscuro 100 → 1000 |
| --- | --- | --- |
| `gray` | `#FFFFFF` `#F7F8F6` `#EEF0EC` `#D5DAE2` `#B8C0CC` `#98A2B3` `#6B7689` `#55627A` `#3E4A5F` `#0F1B2D` | `#0C1422` `#101A2B` `#142036` `#26354F` `#32435F` `#4A5A76` `#6E7E98` `#9AA7BE` `#B9C3D4` `#EDF1F7` |
| `blue` | `#F3F5FF` `#E6EBFF` `#D3DBFF` `#B3C0FF` `#8FA0F5` `#6478EC` `#3346D9` `#2A3BB0` `#22318A` `#17205C` | `#0E1630` `#14204A` `#1B2B63` `#24378A` `#3149B3` `#4560D6` `#7C8CFF` `#9AA8FF` `#C2CBFF` `#EEF1FF` |
| `amber` | `#FFF9EC` `#FEF0CF` `#FDE3A3` `#FBD06B` `#F5B93F` `#E9A21B` `#C4800C` `#9A6209` `#6E4506` `#3D2603` | `#1A1407` `#2A2009` `#3D2E0C` `#5C4512` `#8A6518` `#B9841E` `#F5B93F` `#F8C96A` `#FBDD9E` `#FFF5DB` |
| `red` | `#FFF5F5` `#FFE3E3` `#FFC9C9` `#FFA8A8` `#F87171` `#EF4444` `#D92D2D` `#B42323` `#8A1C1C` `#511010` | `#1F0D0D` `#2E1212` `#431A1A` `#662424` `#8F3131` `#C24444` `#F06A6A` `#F58E8E` `#FBB9B9` `#FFE8E8` |
| `green` | `#F1FBF4` `#DDF6E6` `#BDEFD0` `#8EE3B1` `#4CCB85` `#22B06A` `#14894F` `#0F6C3E` `#0B4F2D` `#06301B` | `#0A1A11` `#0F2619` `#15351F` `#1F4D2E` `#2A6B40` `#35905A` `#4CCB85` `#7EDBA5` `#B3EDCB` `#E6F9EE` |

`teal`, `purple` y `pink` no tienen valores todavía; se definirán cuando se elijan las categorías de los gráficos.

**Otros tokens** (custom properties CSS, en `tokens.css`):

| Grupo | Tokens | Valor por defecto |
| --- | --- | --- |
| Tipografía | `--ig-font-display`, `--ig-font-body`, escala `--ig-text-xs…4xl` (titular con `clamp()`) | Bricolage Grotesque / Instrument Sans |
| Forma y espacio | `--ig-space-1…8`, `--ig-radius-sm/md/lg` (tarjetas: 14 px), `--ig-max-width` (880 px) | |

**Temas:** `light` y `dark` (que sigue `prefers-color-scheme` salvo que se fuerce uno), más los que salgan del estilo definitivo. Se aplican con `data-ig-theme` en el contenedor raíz.

**Fuentes:** en la referencia se cargan desde Google Fonts, algo que la regla de "sin recursos externos" no permite. Se **autoalojan** (`woff2` en `design-system/fonts/`, servidas por la app desde el mismo origen) y la **exportación** las incrusta en base64 para que el `.html` siga siendo autocontenido. Pila de respaldo: `system-ui, sans-serif`.

**Componentes** (clases `ig-*`, en `components.css`). Los marcados con ★ existen ya en la referencia:

| Categoría | Componente | Uso |
| --- | --- | --- |
| Estructura | ★ `ig-header` | Titular + entradilla, con filete inferior grueso |
| | ★ `ig-section` | Bloque con titular-conclusión y subtítulo de medida |
| | ★ `ig-card` | Superficie base de cualquier bloque |
| | ★ `ig-grid` | Rejilla auto-fit de tarjetas (mín. 230 px) |
| | ★ `ig-verdict` | Cierre en bloque invertido de alto contraste |
| | ★ `ig-footer` | Fuente, autor y fecha |
| Datos | ★ `ig-bar-chart` | Barras horizontales con etiqueta y valor dentro; variante `--projected` (rayado, color secundario) para previsiones |
| | ★ `ig-stat` | Cifra destacada (KPI) con etiqueta |
| | ★ `ig-change` | Antes → después (valor anterior tachado, nuevo destacado); variante `--worse` en color secundario |
| | ★ `ig-timeline` | Hitos verticales; variante `--now` para el punto actual |
| | `ig-donut` | Proporción con `conic-gradient` |
| | `ig-stacked-bar` | Reparto de un total |
| | `ig-line-chart` | Serie temporal en SVG inline |
| | `ig-ranking` | Lista ordenada con barras |
| | `ig-pictogram` | "X de cada 10" |
| Texto | ★ `ig-callout` | Nota con borde lateral de color para el dato que explica el gráfico |
| | ★ `ig-options` | Dos o más alternativas en paralelo (título + explicación) |
| | `ig-quote` | Cita destacada |
| | `ig-key-points` | Lista de ideas clave (infografías sin datos, GEN-10) |

Cada componente define su marcado canónico, las variantes, las custom properties de datos que acepta (`--ig-value` en % de la barra, `--ig-max`…) y sus reglas de accesibilidad: contraste AA, valores siempre visibles como texto y `<title>` en los SVG. Todos se adaptan solos al ancho, desde 360 px hasta 1200 px.

### 6.3 Render y exportación

- La BD guarda el **fragmento** por idioma y la **versión del DS** con la que se creó (`ds_version`).
- El renderer de Next.js monta el documento completo: `<!doctype html>` + `<html lang>` + CSS del DS en esa versión + `data-ig-theme` + fragmento. Ese documento se inyecta en el iframe (`srcdoc`) en las vistas privada y compartida.
- **Descargar `.html`** produce el mismo documento con el CSS y las fuentes incrustados, totalmente autocontenido.
- Versionado semántico del DS. Un cambio *breaking* (renombrar o eliminar una clase) obliga a subir la versión mayor; las versiones anteriores del CSS se conservan para no romper infografías antiguas.

### 6.4 Organización y fuente única

```text
design-system/
├── tokens.css
├── themes.css
├── components.css
├── fonts/            # woff2 autoalojadas
├── manifest.ts       # clases, variantes y custom properties permitidas (lo usa el validador)
├── components/       # una ficha .md por componente: propósito, marcado, cuándo usarlo
├── examples/         # infografías de referencia (la primera, la del artifact) reescritas con el DS
└── CHANGELOG.md
```

- `manifest.ts` es la fuente de verdad del vocabulario. De él salen el validador (§5.5) y la skill del agente (`agent/skills/design-system.md`), que se regenera con un script para que nunca queden desincronizados.
- `examples/` sirve como few-shot para el agente y como caso de regresión visual.
- La página privada **`/design-system`** de la app es un catálogo vivo: muestra cada componente en cada tema y en los dos idiomas, con datos de ejemplo.

---

## 7. Modelo de datos (PostgreSQL + Drizzle)

Schema en `db/schema.ts`; migraciones con `drizzle-kit`. El contenido de cada idioma va en una tabla aparte. Equivalente en SQL:

```sql
create extension if not exists pg_trgm;

create type infographic_status as enum ('draft', 'saved');
create type locale as enum ('es', 'en');

-- Metadatos comunes, independientes del idioma
create table infographics (
  id               uuid primary key default gen_random_uuid(),
  status           infographic_status not null default 'draft',
  original_locale  locale      not null,          -- idioma en que se generó primero
  ds_version       text        not null,          -- p. ej. "1.0.0"
  theme            text        not null default 'light',
  source_text      text        not null,
  source_language  text        not null,          -- idioma detectado del texto pegado
  source_url       text,
  model            text,
  eve_session_id   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Contenido por idioma (1 o 2 filas por infografía)
create table infographic_contents (
  infographic_id  uuid   not null references infographics(id) on delete cascade,
  locale          locale not null,
  is_translation  boolean not null default false,  -- true si viene de save_translation
  title           text   not null,
  summary         text   not null,
  tags            text[] not null default '{}',
  key_data        jsonb  not null default '[]',
  html            text   not null,                -- fragmento con componentes del DS
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  search_vector   tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', array_to_string(tags, ' ')), 'A') ||
    setweight(to_tsvector('simple', coalesce(summary, '')), 'B')
  ) stored,
  primary key (infographic_id, locale)
);

create table share_links (
  id              uuid primary key default gen_random_uuid(),
  infographic_id  uuid not null references infographics(id) on delete cascade,
  token           text not null unique,     -- aleatorio, ≥128 bits, base64url
  default_locale  locale,                   -- null = según el navegador del invitado
  expires_at      timestamptz,              -- null = no caduca
  revoked_at      timestamptz,
  created_at      timestamptz not null default now()
);

create index contents_search_idx    on infographic_contents using gin (search_vector);
create index contents_title_trgm    on infographic_contents using gin (title gin_trgm_ops);
create index contents_tags_idx      on infographic_contents using gin (tags);
create index infographics_source_fts on infographics using gin (to_tsvector('simple', source_text));
create index infographics_created_idx on infographics (created_at desc);
```

Notas:

- **¿Por qué PostgreSQL?** Encaja muy bien con este proyecto: búsqueda full-text y por trigramas integrada (no hace falta Algolia ni Elasticsearch), `jsonb` para los datos clave, la opción de añadir `pgvector` en el futuro y soporte de primera en Drizzle. En Vercel, Neon desde el Marketplace se configura en un clic, inyecta `DATABASE_URL` y tiene ramas de BD para las preview deployments.
- Se usa la configuración `simple` porque el contenido mezcla español e inglés. Si hiciera falta stemming, se puede usar `spanish` o `english` según la fila (`locale`).
- La búsqueda devuelve **infografías**, no contenidos: se agrupan las coincidencias por `infographic_id` y se muestra el contenido del idioma del toggle si existe.
- **Better Auth** gestiona sus propias tablas (`user`, `session`, `account`, `verification`) mediante su adaptador de Drizzle; se generan con su CLI y se añaden al mismo schema.

---

## 8. Seguridad y privacidad

- **Auth con Better Auth:** login con **Google** (OAuth) restringido a una **allowlist** con el email del propietario (`OWNER_EMAIL`). Un hook de Better Auth rechaza la creación de cualquier otro usuario. Sesiones en la BD con cookies `httpOnly`, `secure` y `sameSite=lax`.
- **`proxy.ts`** (el antiguo `middleware` de Next 16) exige sesión en todo salvo `/s/*`, `/api/auth/*` y los assets estáticos (incluidas las fuentes del DS). No se usa Vercel Deployment Protection en producción porque bloquearía los enlaces compartidos.
- **Canal eve (M3):** `agent/channels/eve.ts` verificará la misma sesión de Better Auth con un `AuthFn` propio. Los invitados nunca llegarán al agente.
- **Enlaces compartidos:** el token se compara directamente en la BD y se comprueban `revoked_at` y `expires_at`. Cualquier fallo devuelve 404 genérico, sin distinguir "no existe" de "revocado". Llevan `noindex` y `Referrer-Policy: no-referrer`.
- **Render aislado:** siempre `<iframe sandbox srcdoc>` sin `allow-scripts`, además de la validación de §5.5 y una CSP estricta en las vistas de infografía. Doble barrera.
- **Datos:** los textos pegados se envían al proveedor del modelo vía AI Gateway y a ningún otro servicio. Los secretos (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) solo en variables de entorno de Vercel.

---

## 9. Requisitos no funcionales

| Área | Objetivo |
| --- | --- |
| Rendimiento | Generación típica < 60 s para ~1.500 palabras, con progreso visible. Traducción < 30 s. Búsqueda < 300 ms con ~1.000 infografías. Vista compartida con TTFB < 500 ms. |
| Fiabilidad | Si el agente falla, la UI conserva el texto y permite reintentar. Los borradores huérfanos se limpian a los 7 días. |
| Calidad | Evals de eve en CI (ES y EN). Regresión visual del catálogo `/design-system` (P2). |
| Mantenibilidad | TypeScript estricto. `db/`, `design-system/manifest.ts` y `messages/` son fuentes únicas. |
| Compatibilidad | Últimas versiones de Chrome, Safari y Firefox, en escritorio y móvil (las vistas compartidas se abrirán sobre todo en móvil). |

---

## 10. Pantallas

Todas las pantallas privadas llevan en la cabecera el **toggle ES/EN** y el menú de sesión.

1. **Login (`/login`)** — botón "Continuar con Google". Si el email no está en la allowlist, muestra un error genérico.
2. **Generar (`/`)** — área de texto y campos opcionales (tema e idioma de salida, "original" por defecto), *Generar*, progreso, previsualización, panel de datos clave y avisos, *Conservar / Refinar / Descartar*.
3. **Biblioteca (`/library`)** — buscador, filtros, rejilla de tarjetas y estado vacío.
4. **Detalle (`/i/[id]`)** — infografía en el idioma del toggle (o *Traducir* si no existe), metadatos, datos clave, texto original, *Compartir* (crear, copiar, revocar, caducidad, idioma por defecto), *Descargar*, *Copiar HTML*, *Refinar*, *Eliminar*.
5. **Design system (`/design-system`)** — catálogo vivo de tokens, temas y componentes.
6. **Vista compartida (`/s/[token]`)** — la infografía a pantalla completa con su pie y, si hay dos idiomas, un toggle ES/EN discreto. Nada más.

---

## 11. Hitos

| Hito | Contenido |
| --- | --- |
| Hito | Contenido |
| --- | --- |
| M0 — Base | Mover el agente a `agent/`, `withEve` en Next, Neon + Drizzle + primera migración (solo tablas de Better Auth; el esquema de la aplicación se crea en M2/M3), Better Auth con Google y allowlist, `proxy.ts` y login. Infraestructura i18n (diccionarios + toggle). Eve queda fuera de M0: el canal del agente y la spike de importación pasan a M3. **Cerrado el 2026-10-29** con dos pendientes trasladados a M1: prueba de rechazo de cuentas no propietarias y pruebas E2E del login. Las migraciones están aplicadas en la rama `dev`; `main` queda pendiente. |
| M1 — Design system | Tokens (escalas de 10 pasos y tokens semánticos, §6.2), temas claro y oscuro, fuentes autoalojadas, los 12 componentes ★ de la referencia, `manifest.ts`, validador compartido, página `/design-system` y la referencia reescrita en `examples/`. Arrastre de M0: prueba E2E de que una cuenta no propietaria es rechazada por el hook de allowlist, y pruebas E2E del login y de la protección de rutas (`AGENTS.md`). |
| M2 — Frontend | Biblioteca, búsqueda full-text multidioma con ranking y filtros, detalle, descargar/copiar/eliminar, compartir (`share_links`, `/s/[token]`, revocar, caducidad, Open Graph, `noindex`) y toggle de idioma. Se prueba con infografías de ejemplo, sin agente. |
| M3 — Agente | Agente eve: canal con auth del propietario (`agent/channels/eve.ts`) y spike de importación de `db/` y `design-system/` desde fuera de `agent/` con una tool mínima que lea de la BD. Generar con `save_infographic` (validación y reintentos), renderer de borradores, conservar/descartar, refinar en la misma sesión, `save_translation` con *Traducir* y evals en ES y EN. |
| M4 — Pulido | Componentes de datos restantes, evals en CI, cron de limpieza de borradores y aplicar el estilo visual definitivo cuando llegue. |

---

## 12. Decisiones tomadas

| Tema | Decisión |
| --- | --- |
| Frontend | Next.js 16 (App Router) |
| Agente | eve, en `agent/` en la raíz del repo |
| Base de datos | PostgreSQL (Neon vía Vercel Marketplace) |
| ORM | Drizzle |
| Migraciones por etapa | M0 solo crea las tablas de Better Auth (`0000_auth_better_auth_tables`). El esquema de la aplicación (§7: `infographics`, `infographic_contents`, `share_links`) se añade en M2/M3, con migraciones nombradas por funcionalidad. Así no se crean tablas que todavía no se usan. |
| Auth | Better Auth con Google, con allowlist de un único email |
| Despliegue | Vercel, app y agente en el mismo proyecto |
| Acceso | Solo el propietario; invitados únicamente por enlace compartido |
| Guardado | El agente valida y sube vía tool; la validación es código determinista. Primero se guarda como `draft` y pasa a `saved` al pulsar *Conservar*. |
| Formato | Fragmento HTML con un design system propio; exportación autocontenida |
| Idioma de la UI | Español por defecto, con toggle a inglés (también en la vista compartida) |
| Idioma de las infografías | Se generan en el idioma del texto original (con opción de forzar ES/EN) y se traducen solo bajo demanda |
| Referencia visual | Artifact *Los sacrificios ya están decididos* (estructura); el estilo definitivo llegará más adelante |
| Orden de trabajo | Design system → frontend → agente, tras M0. El spike de importación del agente se hace al inicio de M3 para no descubrir el riesgo al final |
| Color del DS | Estructura de escalas de 10 pasos con uso por paso y tokens semánticos, inspirada en Geist (sin copiar sus valores). Valores propios: defaults en v1, después los del propietario |

## 13. Preguntas abiertas

1. **Modelo** del agente: se define más adelante.
2. **Estilo visual** definitivo del design system: lo aportará el propietario.
