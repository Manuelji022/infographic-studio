# Infographic Studio — Functional Spec

> Estado: **borrador v0.9** · Última actualización: 2026-10-30
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
| Design system | `design-system/` (tokens JSON → CSS, componentes de UI en React y vocabulario `ig-*` de infografía) | Fuente única del lenguaje visual, compartida por el agente y la app (§6) |
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

### 5.6 Evolución futura: salida estructurada (P2, fuera de v1)

**Idea.** En lugar de que el agente escriba el HTML, devolvería un **documento estructurado** (JSON validado con un schema) con una lista de bloques tipados: `{ type: "stat", value, label, … }`, `{ type: "bar-chart", rows: [...] }`, etc. Un **renderer determinista** (el mismo del §6.3) convertiría ese JSON en el fragmento HTML con las clases `ig-*`. La BD podría guardar el JSON, el HTML o ambos.

**Qué aportaría:**

- **Validación más fuerte:** el schema impide por construcción clases, etiquetas o atributos fuera del vocabulario; el modelo no puede producir HTML inválido.
- **Traducción más simple y segura (I18N-06):** se traducen cadenas de texto y se conservan estructura y cifras. Comprobar que las cifras coinciden pasa a ser comparar campos, no analizar HTML.
- **Trazabilidad de datos:** cada cifra puede llevar su `sourceQuote` dentro del propio bloque, en vez de buscarla en `keyData` y en el HTML por separado.
- **Rediseños sin regenerar:** un cambio de marcado o de estilo del design system se aplica volviendo a renderizar el JSON, sin pedir nada al modelo.
- **Menos tokens de salida** en infografías grandes.

**Qué costaría:**

- Mantener un schema por componente además del manifiesto de clases (o derivar uno del otro).
- Menos libertad para el agente: un caso nuevo exige añadir un tipo de bloque, no solo marcado.
- Un renderer más que probar y versionar. Hay que decidir qué se guarda en la BD y cómo se migran las infografías ya guardadas en HTML.

**Cuándo reconsiderarlo** (cualquiera de estas señales):

1. La traducción falla o se vuelve cara de validar (cifras que no coinciden, HTML roto al traducir).
2. La validación del HTML se vuelve frágil o los reintentos del agente (máx. 3, §3.1) se disparan.
3. Hace falta rediseñar el marcado de componentes y regenerar infografías antiguas sería costoso.

**Qué lo mantiene barato hoy.** El vocabulario cerrado (`manifest.ts`, §6.4), la regla "cada cifra visible está en `keyData` con su `sourceQuote`" (§5.4) y el renderer único (§6.3) son los mismos ingredientes que necesitaría esta evolución. No hay que decidir nada ahora; solo evitar acoplar la app al HTML como único formato de almacenamiento. En v1 el HTML sigue siendo la fuente de verdad (§12, *Formato*).

---

## 6. Design system

Es el lenguaje visual común de todo el producto. Tiene **dos consumidores** que comparten tokens, temas y fuentes pero no componentes:

| Capa | Quién la usa | Tecnología |
| --- | --- | --- |
| **UI de la app** (primitivas y composites, p. ej. `PromptComposer`) | Nosotros, en Next.js | Componentes React con CSS Modules |
| **Infografía** (vocabulario cerrado `ig-*`) | El agente, que compone HTML; la app lo renderiza y exporta | HTML + CSS plano, sin JavaScript |

El agente **nunca genera componentes React**: solo fragmentos HTML con clases `ig-*` (§5.4).

> **Estilo visual: editorial de papel cálido.** Superficies marfil, serif para el cuerpo, sans para la interfaz y un único acento arcilla. Se inspira en una referencia externa de estilo, **sin copiarla**: las fuentes son libres y los nombres de tokens son propios (`--ds-*`). La referencia estructural de los componentes de infografía sigue siendo el artifact [*Los sacrificios ya están decididos*](https://claude.ai/artifact/D2HeTGpqvoK2jRFPn4YikW), del que salen los componentes ★ y el patrón narrativo de §6.2. El **plan de ejecución** vive en `DESIGN_SYSTEM_PLAN.md`; esta sección define el *qué*.

### 6.1 Por qué

- **Consistencia:** todas las infografías y pantallas se reconocen como parte de la misma colección.
- **Calidad:** el agente ensambla piezas ya diseñadas y probadas en lugar de inventar CSS cada vez.
- **Seguridad y validación:** con un vocabulario cerrado de clases, la validación es simple y fiable.
- **Eficiencia:** el HTML generado es más pequeño, se generan menos tokens y es más rápido.
- **Una sola fuente de verdad:** los tokens viven en JSON (formato DTCG) y de ellos salen el CSS, el informe de contraste y el catálogo. Nada se mantiene en dos sitios.
- **Evolución:** un cambio en el DS mejora todas las infografías, incluidas las antiguas, salvo las que se fijen a una versión.

### 6.2 Contenido

**Principios de diseño** (reglas que se verifican en la revisión):

1. **Plano:** sin sombras ni degradados (única excepción documentada: el rayado de las barras proyectadas). La elevación se consigue con el tono de la superficie y bordes de 1 px.
2. **Un solo acento (arcilla)**, reservado a la acción principal de la pantalla. En las infografías, que no tienen acciones, es además el color principal de los datos.
3. **Serif para el cuerpo, sans para la UI.** Geist se reserva a controles, navegación, etiquetas y al titular declarativo.
4. **Sin blancos puros ni colores fríos.** Todo el neutro sale de la familia marfil/slate.
5. **Cero colores literales fuera de los primitivos.** Los componentes solo usan tokens semánticos.
6. **Contraste AA** (4.5:1 texto, 3:1 elementos grandes e iconos) comprobado por script en ambos temas. El gris nube (`cloud-medium`) no se usa para texto.
7. **Foco visible** (`:focus-visible`) y **enlaces con subrayado persistente.**
8. **Responsive de 360 a 1280 px**, con titulares fluidos.
9. **Los componentes de UI no llevan textos propios:** reciben cadenas por props y la i18n vive en la app (§4.5).

**Tokens.** Dos capas: **primitivos**, que no cambian con el tema, y **semánticos**, que sí. Todo se define en JSON DTCG (`$value`, `$type`) y un script propio genera el CSS con custom properties `--ds-*`.

**Primitivos de color:**

| Token | Valor | Token | Valor |
| --- | --- | --- | --- |
| `slate-dark` | `#141413` | `ivory-light` | `#faf9f5` |
| `slate-medium` | `#3d3d3a` | `oat-warm` | `#e3dacc` |
| `cloud-dark` | `#87867f` | `manilla` | `#f5e3c7` |
| `cloud-medium` | `#b0aea5` | `clay` | `#d97757` |
| `stone` | `#cccbc8` | `clay-deep` | `#c6613f` |
| `ivory-medium` | `#f0eee6` | | |

A ellos se suman los tonos derivados que haga falta (por ejemplo, un texto atenuado que cumpla AA), siempre justificados por el informe de contraste.

**Tokens semánticos** (cada tema debe definirlos todos; si falta uno, el build falla):

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--ds-canvas` | `ivory-medium` | `slate-dark` | Fondo de página |
| `--ds-surface` | `ivory-light` | derivado | Tarjetas y paneles |
| `--ds-surface-feature` | `manilla` | derivado | Tarjeta destacada |
| `--ds-surface-deep` | `oat-warm` | `slate-medium` | Paneles agrupados |
| `--ds-surface-inverse` | `slate-dark` | `ivory-light` | Cierre de alto contraste (`ig-verdict`), pie |
| `--ds-text` | `slate-dark` | `ivory-light` | Texto principal |
| `--ds-text-muted` | derivado, AA | derivado, AA | Texto secundario |
| `--ds-text-inverse` | `ivory-light` | `slate-dark` | Texto sobre `surface-inverse` |
| `--ds-border` | `stone` | `slate-medium` | Bordes y divisores |
| `--ds-border-strong` | `cloud-dark` | `cloud-dark` | Bordes de controles |
| `--ds-accent` / `--ds-accent-hover` | `clay` / `clay-deep` | igual | Acción principal |
| `--ds-on-accent` | `slate-dark` | `slate-dark` | Texto sobre el acento |
| `--ds-focus-ring` | `slate-dark` | `ivory-light` | Anillo de foco |
| `--ds-data-1…6` | `clay-deep`, `slate-dark`, `ochre`, `olive`, `taupe`, `sage` | `clay`, `ivory-light`, `ochre-light`, `olive-light`, `taupe-light`, `sage-light` | Series y categorías de gráficos (≥ 3:1 sobre canvas y surface en ambos temas, según el informe de contraste) |

**Tipografía.** Roles definidos en JSON; el generador emite `--ds-type-{rol}-*` y una clase `.ds-type-{rol}`. Display y heading son **fluidos** (`clamp()`, mínimos propuestos 40 y 36 px, a validar a 360 px).

| Rol | Familia | Tamaño / peso / interlineado | Uso |
| --- | --- | --- | --- |
| `display` | serif | 68 / 400 / 1.1 | Titular editorial |
| `heading` | sans | 61 / 700 / 1.1 | Titular declarativo |
| `subheading-serif` / `subheading-sans` | serif / sans | 24 / 400 / 1.4 · 24 / 600 / 1.3 | Subtítulos |
| `title` | sans | 20 / 700 / 1.3 | Título de tarjeta |
| `body` | serif | 20 / 400 / 1.4 | Cuerpo principal |
| `body-lg` / `body-strong` / `body-sm` | serif | 18 / 400 · 18 / 600 · 14 / 400 | Cuerpo intermedio, énfasis, secundario |
| `ui` / `ui-medium` / `ui-strong` | sans | 16 / 400 · 500 · 600 / 1.4 | Controles y botones |
| `ui-sm` | sans | 15 / 400 / 1.4 | Navegación |
| `ui-single` | sans | 15–16 / 400 / **1.0** | **Solo una línea** (botones, navegación) |
| `caption` / `caption-medium` / `label` | sans | 12 / 400 · 500 / 1.4 · 12 / 400 / 1.25 | Pies, badges, etiquetas |
| `code` | mono | 16 / 400 / 1.4 | Código |

**Forma, espacio y layout.** Espaciado de base 4 px (4, 8, 12, 16, 24, 32, 76, 100). Radios 0, 8, 12, 16 y 24 px; por componente: tarjeta 24 px, botón relleno **solo con esquinas inferiores de 8 px** (las superiores a 0), botón con borde 12 px, badge y navegación 0. Ancho de página 1280 px; ancho de prosa de la infografía 880 px. Sin sombras.

**Temas:** `light` y `dark`, más `auto` (sigue `prefers-color-scheme`). Se aplican con el atributo `data-ds-theme` en el contenedor raíz; sin atributo, tema claro. El **tema oscuro es derivado** (la referencia solo define el claro) y está **aprobado** (2026-10-30).

**Fuentes** (autoalojadas, variables, subset `latin`, licencia OFL; sin recursos externos):

| Rol | Familia | Archivo | Ejes |
| --- | --- | --- | --- |
| Serif | **Source Serif 4** | `source-serif-4-latin-opsz-wght.woff2` (122 KB) | `wght` 200–900, `opsz` 8–60 |
| Sans | **Geist** | `geist-latin-wght.woff2` (29 KB) | `wght` 100–900 |
| Mono | **Geist Mono** | `geist-mono-latin-wght.woff2` (23 KB) | `wght` 100–900 |

Se sirven desde el mismo origen (`design-system/fonts/` → `public/fonts/`) y la **exportación** las incrusta en base64. Sin cursivas en v1. Pila de respaldo: `ui-serif, Georgia, serif` / `system-ui, sans-serif` / `ui-monospace, monospace`.

**Componentes de UI** (React, en `design-system/ui/`):

| Nivel | Componentes |
| --- | --- |
| Primitivas | `Text`, `Button` (variantes `accent`, `ivory`, `outline`, `ghost`), `Link`, `Badge`, `Icon`, `Card` (variantes `surface`, `feature`, `deep`, `inverse`), `Divider`, `Spinner`, `Skeleton`, `VisuallyHidden`, `Callout`, `Label`, `Field`, `Input`, `Textarea`, `Select`, `Checkbox`/`Switch`, `Dialog` |
| Composites | `PromptComposer` (área grande de texto de la pantalla Generar: contador, límite orientativo, opciones y botón Generar), `AppHeader` con `LanguageToggle`, `InfographicCard`, `SearchBar`, `FilterBar`, `ShareDialog`, `ConfirmDialog`, `GenerationProgress`, `EmptyState`, `ErrorState` |

Reglas de código: variantes explícitas (no props booleanas de estilo), `ref` como prop (React 19), composición con subcomponentes y sin estado global dentro del componente.

**Patrón narrativo de las infografías** (tomado de la referencia):

1. `ig-header`: titular contundente que resume la tesis, con entradilla.
2. 3-6 `ig-section`, cada una con un titular que es **una conclusión** ("El peso de las pensiones se ha multiplicado por 2,7"), no un tema ("Gasto en pensiones"). Debajo, una línea que explica qué se mide y en qué unidad.
3. `ig-verdict`: cierre en un bloque de alto contraste con la idea final.
4. `ig-footer`: autor, medio, año y fuentes citadas.

**Componentes de infografía** (clases `ig-*`, en `design-system/infographic/components.css`). Los marcados con ★ existen ya en la referencia:

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
| | ★ `ig-change` | Antes → después (valor anterior tachado, nuevo destacado); variante `--worse` |
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

Cada componente define su marcado canónico, las variantes, las custom properties de datos que acepta (`--ig-value` en % de la barra, `--ig-max`…) y sus reglas de accesibilidad: contraste AA, valores siempre visibles como texto y `<title>` en los SVG. Todos se adaptan solos al ancho, desde 360 px hasta 1200 px. Usan únicamente tokens semánticos, de modo que cambiar la paleta no toca los componentes.

### 6.3 Render y exportación

- La BD guarda el **fragmento** por idioma y la **versión del DS** con la que se creó (`ds_version`).
- El renderer de Next.js (`buildDocument(fragmento, { locale, theme, dsVersion, embed })`) monta el documento completo: `<!doctype html>` + `<html lang>` + CSS del DS en esa versión + `data-ds-theme` + fragmento dentro de `.ig-root`. Ese documento se inyecta en el iframe (`srcdoc`) en las vistas privada y compartida.
- **Descargar `.html`** produce el mismo documento con el CSS y las fuentes incrustados en base64, totalmente autocontenido.
- Versionado semántico del DS. Un cambio *breaking* (renombrar o eliminar una clase) obliga a subir la versión mayor; las versiones anteriores del CSS se conservan para no romper infografías antiguas.

### 6.4 Organización y fuente única

```text
design-system/
├── fonts/            # woff2 + licencias + fonts.css
├── tokens/           # JSON DTCG (primitives, typography, semantic, themes/) y build/ (CSS generado)
├── ui/               # React: primitives/ y composites/
├── infographic/      # components.css (ig-*), manifest.ts, validate.ts, render.ts
├── components/       # una ficha .md por componente: propósito, marcado, cuándo usarlo
├── examples/         # infografías de referencia (ES y EN), reescritas con el DS
├── catalog/          # secciones del catálogo vivo
└── CHANGELOG.md
scripts/
├── build-tokens.mjs  # JSON → CSS, con --check de deriva
├── check-contrast.mjs
└── sync-design-system-fonts.mjs
```

- Los **JSON de `tokens/`** son la fuente de verdad de color, tipografía, espaciado y radios. `build-tokens.mjs` genera el CSS, resuelve los alias y falla si hay un alias roto, un valor inválido o falta una clave semántica en algún tema. Un comando de comprobación detecta CSS editado a mano. El CSS generado no se edita.
- `infographic/manifest.ts` es la fuente de verdad del vocabulario de infografía. De él salen el validador (§5.5) y la skill del agente (`agent/skills/design-system.md`), que se regenera con un script para que nunca queden desincronizados.
- `examples/` sirve como few-shot para el agente y como caso de regresión visual.
- La página privada **`/design-system`** de la app es un catálogo vivo: muestra tokens, temas y cada componente (UI e infografía) en cada tema y en los dos idiomas, con datos de ejemplo.

### 6.5 Verificación del design system

- **Contraste:** `check-contrast.mjs` calcula las razones WCAG de los pares texto/fondo y elemento/fondo de ambos temas y emite un informe reproducible; falla si algo no cumple AA.
- **Reglas de estilo:** comprobaciones por `grep` de que no hay colores literales fuera de los primitivos, ni sombras, ni degradados (salvo la excepción documentada), ni `!important`.
- **Visual:** capturas del catálogo en claro y oscuro a 360 y 1280 px. La regresión visual automática llega con Playwright (P2 de calidad, §9).
- **E2E (Playwright):** rechazo de cuentas no propietarias, login y protección de rutas (arrastre de M0), y que el catálogo renderice todos los componentes sin errores de consola.

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
| Calidad | Evals de eve en CI (ES y EN). Informe de contraste AA reproducible en ambos temas (§6.5). Regresión visual del catálogo `/design-system` (P2). |
| Mantenibilidad | TypeScript estricto. `db/`, `design-system/tokens/` (JSON), `design-system/infographic/manifest.ts` y `messages/` son fuentes únicas; el CSS de tokens es generado. |
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

| Completado | Hito | Contenido |
| --- | --- | --- |
| [x] | M0 — Base          | Mover el agente a `agent/`, `withEve` en Next, Neon + Drizzle + primera migración (solo tablas de Better Auth; el esquema de la aplicación se crea en M2/M3), Better Auth con Google y allowlist, `proxy.ts` y login. Infraestructura i18n (diccionarios + toggle). Eve queda fuera de M0: el canal del agente y la spike de importación pasan a M3. **Cerrado el 2026-10-29** con dos pendientes trasladados a M1: prueba de rechazo de cuentas no propietarias y pruebas E2E del login. Las migraciones están aplicadas en la rama `dev`; `main` queda pendiente. |
| [ ] | M1 — Design system | Estilo editorial de papel cálido (§6). Tokens en JSON DTCG con generador propio y check de deriva, temas claro y oscuro (el oscuro, derivado, aprobado el 2026-10-30), informe de contraste AA, fuentes autoalojadas (**hechas**: Source Serif 4, Geist y Geist Mono), componentes de UI (primitivas y composites, incl. `PromptComposer`), los 12 componentes `ig-*` ★ con su `manifest.ts`, validador y renderer/exportación, página `/design-system` y la referencia reescrita en `examples/`. Plan por oleadas en `DESIGN_SYSTEM_PLAN.md`. Arrastre de M0: prueba E2E de que una cuenta no propietaria es rechazada por el hook de allowlist, y pruebas E2E del login y de la protección de rutas (Playwright; `AGENTS.md`). |
| [ ] | M2 — Frontend      | Biblioteca, búsqueda full-text multidioma con ranking y filtros, detalle, descargar/copiar/eliminar, compartir (`share_links`, `/s/[token]`, revocar, caducidad, Open Graph, `noindex`) y toggle de idioma. Se prueba con infografías de ejemplo, sin agente.                                                                                                                                                                                                                                                                                                       |
| [ ] | M3 — Agente        | Agente eve: canal con auth del propietario (`agent/channels/eve.ts`) y spike de importación de `db/` y `design-system/` desde fuera de `agent/` con una tool mínima que lea de la BD. Generar con `save_infographic` (validación y reintentos), renderer de borradores, conservar/descartar, refinar en la misma sesión, `save_translation` con *Traducir* y evals en ES y EN.                                                                                                                                                                                      |
| [ ] | M4 — Pulido        | Componentes de datos restantes, evals en CI, cron de limpieza de borradores y aplicar el estilo visual definitivo cuando llegue.                                                                                                                                                                                                                                                                                                                                                                                                                                    |

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
| Referencia visual | Estilo: editorial de papel cálido inspirado en una referencia externa, con fuentes y nombres de token propios. Estructura de los componentes `ig-*`: artifact *Los sacrificios ya están decididos* |
| Alcance del design system | Cubre la UI de la app **y** las infografías, con tokens, temas y fuentes compartidos y dos capas de componentes (React para la app; HTML+CSS `ig-*` para el agente). El agente nunca genera React |
| Fuentes | Source Serif 4 (serif, cuerpo), Geist (sans, UI) y Geist Mono (código); variables, subset `latin`, autoalojadas |
| Tokens | JSON DTCG como fuente de verdad y script propio sin dependencias (`build-tokens.mjs`) que genera el CSS; prefijo `--ds-*`. Props de datos de infografía: `--ig-*` |
| Color de datos | Arcilla como color principal de datos en las infografías (no tienen acciones), slate para lo neutro y paleta cálida categórica para el resto |
| Tema oscuro | Derivado (la referencia solo define el claro). **Aprobado por el propietario el 2026-10-30** sobre el catálogo `/design-system` |
| Textos en el DS | Los componentes de UI no llevan textos propios: los reciben por props y la i18n vive en la app |
| E2E | Playwright, con informes como artefacto repetible |
| Salida estructurada del agente | Considerada y aplazada (§5.6): en v1 el HTML sigue siendo la fuente de verdad |
| Orden de trabajo | Design system → frontend → agente, tras M0. El spike de importación del agente se hace al inicio de M3 para no descubrir el riesgo al final |
| Color del DS | Dos capas: primitivos de color (familia marfil/slate/arcilla) y tokens semánticos por tema. Sustituye a las escalas de 10 pasos de azul/gris del borrador anterior |

## 13. Preguntas abiertas

1. **Modelo** del agente: se define más adelante.
2. **Mínimos fluidos** de `display` (40 px) y `heading` (36 px): a validar a 360 px.
3. **Crédito de Source Serif 4:** el paquete de Fontsource trae "Google Inc." como copyright, no la autoría original (Adobe). Decidir si se cita en una página de créditos.
