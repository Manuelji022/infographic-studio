# Design styles plan: Studio and Paper

The design system gets a second visual **style**. Styles are independent of themes: each style has a light and a dark theme.

| Style | Status | Look |
|---|---|---|
| `studio` | Exists, default | Warm ivory/clay palette, Source Serif 4 and Geist, today's `--ds-*` tokens |
| `paper` | New | Neutral greys, blue brand, Geist only, smaller radii and type scale |

Design source: Paper file **"Infography studio"** (file id `01M7AYW8XBXYPD75FGB3C4ZPZ5`), page **"Design system"** (`p-1-0`). Every component has a `<Name> — Paper` frame and a `<Name> — Studio` frame, each showing light and dark.

Owner decisions (2026-11-14):

- The active style is an app-wide user preference, persisted in a cookie. Studio stays the default.
- This run covers tokens and the app UI (`design-system/ui`) only. `ig-*` infographic CSS and charts get Paper in a later run, so chart and `data-*` tokens keep their Studio values under Paper for now.

## 1. Runtime contract

- The attribute is `data-ds-style="studio" | "paper"`. If it is absent, the style is Studio.
- The app sets `data-ds-style` and `data-ds-theme` on `<html>`. The catalog sets both on its stage element.
- Whenever an element sets `data-ds-style`, it also sets `data-ds-theme`. Nested previews rely on this.
- Limitation: below a nested style boundary, set data-ds-style together with every data-ds-theme you add (theme-only descendants are resolved against the outermost style). The app and catalog never do this.
- Components never branch on the style in JavaScript. All differences are CSS, driven by tokens or by a scoped override (section 4).
- Cookie: name `ds-style`, values `studio` or `paper`, path `/`, max age one year, `SameSite=Lax`. It works the same way as the locale cookie (`src/lib/locale.ts`).

## 2. Generated CSS

`pnpm tokens:build` writes:

- `design-system/tokens/build/tokens.css`: unchanged role (Studio primitives, typography, and the semantic layer on `:root`).
- `design-system/tokens/build/themes.css`: the Studio light and dark blocks (as today), then Paper light and dark blocks, then an explicit Studio reset. The selector rules are:
  - Paper light: `[data-ds-style="paper"]`, plus `[data-ds-style="paper"] [data-ds-theme="light"]`.
  - Paper dark: `[data-ds-style="paper"] [data-ds-theme="dark"]`, plus `[data-ds-style="paper"][data-ds-theme="dark"]`, plus the same pair for `auto` inside `@media (prefers-color-scheme: dark)`.
  - When both attributes sit on the same element, that element's own values must win over any ancestor's. Raise specificity on same-element selectors, for example `[data-ds-style="paper"][data-ds-theme="dark"][data-ds-theme]`.
  - A `[data-ds-style="studio"]` element nested inside a Paper ancestor must render Studio. Emit explicit Studio blocks with the same selector shapes.
- `design-system/tokens/build/styles.css` (new): theme-independent overrides per style. These are typography (`--ds-type-*`), font families, radii and Paper primitives. Use `[data-ds-style="paper"] { … }` and `[data-ds-style="studio"] { … }`; plain inheritance resolves nesting here. `src/app/globals.css` imports it after `themes.css`.

## 3. Semantic colour roles

Components use only the roles below. A literal colour or a `--ds-color-*` primitive in component CSS is a bug.

### 3.1 Existing roles, Paper mapping

The Paper values are the Paper file tokens `--color-{light|dark}-<name>`.

| `--ds-*` role | Paper token (light and dark use the same name) |
|---|---|
| `canvas` | `shell` |
| `surface` | `page` |
| `surface-feature` | `brand-subtle` |
| `surface-deep` | `sunken` |
| `surface-inverse` | `inverted` |
| `text` | `primary-foreground` |
| `text-muted` | `secondary-foreground` |
| `text-inverse` | `on-inverted-foreground` |
| `border` | `border-default` |
| `border-strong` | `border-strong` |
| `accent` | `brand-solid` |
| `accent-hover` | `brand-solid-hover` |
| `on-accent` | `on-solid-foreground` |
| `focus-ring` | `focus-ring` |
| `danger` | `danger-solid` |
| `danger-text` | `danger-foreground` |
| `data-*`, `on-data-*`, `chart-*` | unchanged (Studio values; out of scope) |

### 3.2 New roles (defined for both styles)

The Studio values are chosen so that switching a Studio component to a new role changes nothing visually.

| New role | Studio light | Studio dark | Paper |
|---|---|---|---|
| `control` | `ivory-light` (= surface) | `slate-raised` (= surface) | `component` |
| `control-hover` | `oat-warm` (= surface-deep) | `slate-medium` (= surface-deep) | `component-hover` |
| `control-active` | `oat-warm` | `slate-medium` | `component-active` |
| `surface-overlay` | `ivory-light` | `slate-raised` | `overlay` |
| `surface-inverse-hover` | `slate-medium` | `ivory-medium` | `inverted-hover` |
| `text-subtle` | `slate-soft` (= text-muted) | `cloud-medium` | `tertiary-foreground` |
| `text-disabled` | `slate-soft` | `cloud-medium` | `disabled-foreground` |
| `border-subtle` | `stone` (= border) | `slate-medium` | `border-subtle` |
| `accent-active` | `clay-deep` | `clay-deep` | `brand-solid-active` |
| `accent-subtle` | `manilla` | `manilla-night` | `brand-subtle` |
| `accent-text` | `slate-dark` (= text) | `ivory-light` | `brand-foreground` |
| `accent-border` | `cloud-dark` (= border-strong) | `cloud-dark` | `brand-border` |
| `danger-hover` | `red-deep` | `red-deep` | `danger-solid-hover` |
| `danger-subtle` | `ivory-light` | `slate-raised` | `danger-subtle` |
| `danger-border` | `red` | `red` | `danger-border` |
| `success` | `olive` (= data-4) | `olive-light` | `positive-solid` |
| `success-text` | `olive` | `olive-light` | `positive-foreground` |
| `success-subtle` | `ivory-light` | `slate-raised` | `positive-subtle` |
| `success-border` | `olive` | `olive-light` | `positive-border` |
| `warning` | `ochre` (= data-3) | `ochre-light` | `warning-solid` |
| `warning-text` | `ochre` | `ochre-light` | `warning-foreground` |
| `warning-subtle` | `ivory-light` | `slate-raised` | `warning-subtle` |
| `warning-border` | `ochre` | `ochre-light` | `warning-border` |

If a component needs a role that isn't listed, the worker escalates. It does not invent one.

## 4. Typography, fonts and radii (Paper, theme-independent)

Font: Geist for every role except `code`, which uses Geist Mono. Paper doesn't use Source Serif. Role values (size / line-height / weight, tracking):

| Role | Paper | Role | Paper |
|---|---|---|---|
| display | 56/56 · 600 · −0.01em | ui | 15/24 · 400 |
| heading | 44/56 · 600 · −0.01em | ui-medium | 15/24 · 500 |
| subheading-serif | 24/32 · 400 | ui-strong | 15/24 · 600 |
| subheading-sans | 24/32 · 600 | ui-sm | 13/20 · 400 |
| title | 20/24 · 600 | ui-single | 15/16 · 400 |
| body | 18/24 · 400 | caption | 12/16 · 400 |
| body-strong | 15/24 · 600 | caption-medium | 12/16 · 500 |
| body-lg | 18/24 · 400 | label | 11/16 · 500 |
| body-sm | 13/20 · 400 | code | 13/20 · 400 · mono |

`display` and `heading` stay fluid in Paper as well, with minimums of 36px and 32px. Tracking is 0 where none is given.

Paper radius primitives, emitted in `styles.css` under `[data-ds-style="paper"]` and only there: `--ds-paper-radius-xs` 2px, `-sm` 4px, `-md` 6px, `-lg` 8px, `-xl` 10px, `-2xl` 12px, `-3xl` 16px, `-4xl` 20px, `-5xl` 24px, `-full` 9999px. The existing component radius tokens (`radius-card`, `radius-badge`, `radius-nav`, `radius-button-*`) are left alone in the token task.

### Component overrides

A component whose Paper frame differs in geometry or type (radius, padding, height, weight, border width) gets a scoped rule in **its own** CSS module:

```css
@scope (:global([data-ds-style="paper"])) to (:global([data-ds-style="studio"])) {
  :scope .button {
    border-radius: var(--ds-paper-radius-md);
  }
}
```

Use `@scope … to (studio)` so that a Studio subtree inside a Paper ancestor stays Studio, with the nearest boundary winning. `:scope .x` has the same specificity as the old `:global([data-ds-style="paper"]) .x` form. The old form leaked Paper geometry into nested Studio previews; the W2 review found this and the fix wave converted every rule.

Colours still come only from the semantic roles. Never put a Paper colour token in component CSS.

## 5. Invariants

- Studio must look identical before and after this work. Baseline captures (gitignored, regenerable from commit `98a8dfa`) are in `design-system/reports/shots/styles/baseline/{design-system,components}-studio-{light,dark}.png`. They were taken with `node scripts/dev/shoot.mjs http://localhost:3000/<page> <out> 1280 <light|dark> --cookie --wait=4000`.
- A Studio component may move from an old role to a new role only when the Studio value is equal (section 3.2).
- Run `pnpm tokens:check`, `pnpm contrast:check`, `pnpm tsc --noEmit` and `pnpm lint` before reporting.

## 6. Waves

| Wave | Task | Worker | Owns |
|---|---|---|---|
| 1 | T1 Paper tokens and build | Codex `gpt-6.1-sol` medium | `design-system/tokens/**`, `scripts/build-tokens.mjs`, `scripts/lib/tokens.mjs`, `scripts/check-contrast.mjs`, `scripts/dev/styles-check.mjs`, `src/app/globals.css`, `design-system/reports/styles-check.*` |
| 1 | T2 Style preference and toggle in the app | Claude `sonnet` medium | `src/lib/style.ts`, `src/app/layout.tsx`, `src/app/global-error.tsx`, `src/components/**`, `messages/**`, `design-system/ui/composites/StyleToggle/**`, `design-system/components/StyleToggle.md`, `design-system/ui/index.ts` |
| 1 | T3 Catalog style switch | Claude `sonnet` medium | `design-system/catalog/CatalogShell.tsx`, `design-system/catalog/catalog.module.css`, `design-system/catalog/types.ts` |
| 2 | One task per Paper artboard (components) | Claude `sonnet` medium | Only the CSS modules (and specs) of the listed components |
| each | Acceptance verification | Claude `haiku` | Read-only |
| each | Review | Codex `gpt-6-astra` low | Read-only |

## 7. Progress

| Task | Status | Notes |
|---|---|---|
| T1 | accepted (verified, reviewed; auto-descendant fix + nesting limitation documented, 18/18 cascade cases) | Paper token sources, style/theme generation and resets, alpha-aware contrast report; 13 static Chrome cascade cases PASS. Studio tokens unchanged. Four Paper border contrast failures reported without changing design values. |
| T2 | accepted (verified, reviewed; coordinator fixed 44px targets) | `ds-style` cookie, `src/lib/style.ts`, `<html data-ds-style>`, `StyleToggle` composite wired in the app header next to the language toggle. |
| T3 | accepted (verified, reviewed; coordinator made URL the single source of state and fixed replaceState(null) so toggles re-render) | Style group (Studio/Paper) in CatalogShell; `?style=` and `?theme=` seed state via useSearchParams (Suspense-wrapped), toggles use history.replaceState; `data-ds-style` and `data-ds-theme` on the stage. Shots: `design-system/reports/shots/styles/t3-*`. |
| W2-A | accepted (reviewed; @scope fix wave; Studio pixel diff clean) | Text, Label, Link, Icon, Button |
| W2-B | accepted (reviewed; @scope fix wave; Studio pixel diff clean) | Divider, Badge, Note, Spinner, Skeleton, Card |
| W2-C | accepted (reviewed; @scope fix wave; Studio pixel diff clean) | Input, Textarea, Select, Checkbox, Switch, Field |
| W2-D | accepted (reviewed; @scope fix wave; Studio pixel diff clean) | Dialog, ConfirmDialog, ShareDialog |
| W2-E | accepted (reviewed; @scope fix wave; Studio pixel diff clean) | LanguageToggle, UserMenu, AppHeader, StyleToggle |
| W2-F | accepted (reviewed; @scope fix wave; Studio pixel diff clean) | ErrorMessage, ErrorState, EmptyState |
| W2-G | accepted (reviewed; @scope fix wave; Studio pixel diff clean) | ContentTypeSelect, PromptComposer, GenerationProgress |
| W2-H | accepted (reviewed; @scope fix wave; Studio pixel diff clean) | SearchBar, FilterBar, InfographicCard |

## Final checks (2026-11-14)

- Studio `/components`, light and dark, against the baseline: only the spinner bands differ (animation). `/design-system` above the token grid is identical. The token grid lists the new roles and shifts the page by 396px; below it there is only sub-pixel noise.
- Studio nested under a Paper page (cookie `ds-style=paper`, catalog `?style=studio`) against the Studio baseline: only the spinner bands differ.
- Paper in light and dark checked by eye against the frames. Text without its own font rule now takes Paper's body size, not the outer style's (fixed by `body [data-ds-style]` in `src/app/globals.css`).
- `tsc`, `lint`, `tokens:check` and `styles-check` (18 of 18) pass. `contrast:check` fails only the four Paper `border-strong` pairs, which is an owner decision.

## 8. Wave 2 worker brief (component restyle)

Read this whole file first, then `design-system/README.md` and the spec `design-system/components/<Name>.md` of each component you own.

**Source of truth.** Paper file id `01M7AYW8XBXYPD75FGB3C4ZPZ5`. Your task names the `<Name> — Paper` and `<Name> — Studio` frames (node ids). Use the Paper MCP read tools only (`get_tree_summary` first, then `get_jsx` with `includeNodeIds: false` on sub-sections, `get_computed_styles`, `get_screenshot`). Never write to the Paper file.

**Translate Paper tokens to `--ds-*` roles** with §3: `--color-{light|dark}-component` becomes `--ds-control`, `primary-foreground` becomes `--ds-text`, `brand-solid` becomes `--ds-accent`, and so on. Paper type sizes map to the roles in §4. For example, `--text-body-base` with weight 500 is the `ui-medium` role: use `var(--ds-type-ui-medium-*)`. Paper radii map to `--ds-paper-radius-*`.

**How to implement.**
1. Under Paper tokens, much already matches. Capture first, compare, and change only what differs.
2. Swap a declaration to a new §3.2 role only when the role's Studio value equals what Studio used before. Studio must render identically.
3. Put anything that differs only in Paper (radius, padding, height, font weight, border presence or colour role, focus style) in the `@scope` block of the component's own module (§4).
4. Use no literal colours, no Paper colour tokens, no JS branching on the style, and no prop or API changes. Change TSX only to add a class hook, and say so in your report.
5. If a Paper colour has no `--ds-*` role, or a change would need tokens, catalog sections or another component's files, stop and ask in your report. Don't work around it.
6. If a `— Studio` frame disagrees with today's Studio rendering, do NOT change Studio. List the discrepancy in your report.

**Verify.** A dev server already runs on :3000; never start another. Capture `node scripts/dev/shoot.mjs 'http://localhost:3000/components?style=<paper|studio>&theme=<light|dark>' design-system/reports/shots/styles/w2-<task>-<style>-<theme>.png 1280 <light|dark> --cookie --wait=4000` for paper light, paper dark and studio light. The page is 12000px tall, so crop your components with `sips -c <h> <w> --cropOffset <y> <x>`. Look at the crops next to `get_screenshot` of the Paper frames, and fix what differs. Other workers edit other components at the same time, so judge only your own components.

**Report.** List the files changed, a per-component summary of the Paper differences you implemented, Studio discrepancies, the crop paths, and the `pnpm tsc --noEmit` and `pnpm lint` output. Don't commit. Don't start subagents. Don't edit files outside your ownership, including this plan.

**Lessons from W2-A (coordinator, 2026-11-14).**
- `sips --cropOffset` does not crop where asked. Use `node /private/tmp/claude-501/tools/crop.mjs <in.png> <out.png> <top> <height> [left] [width]`, which is built on sharp.
- In Studio, `--ds-control` equals `surface`, NOT `surface-deep` (only `control-hover` and `control-active` equal `surface-deep`). Moving a `surface-deep` fill to `control` changes Studio.
- Paper's `--ds-control*` fills are translucent. A control that can sit on an inverse or deep backdrop must stack the fill on top of `--ds-surface`, using `background: linear-gradient(var(--ds-control), var(--ds-control)), var(--ds-surface);` (see Button `.ivory`). Otherwise it vanishes on dark panels.
