# Design system index

Start here. This file says where things live; it does not duplicate them. Imported in code as `@ds/*` (tsconfig path to this folder).

## Where things live

| Need | Location |
|---|---|
| Design tokens (source of truth, DTCG JSON) | `tokens/primitives.tokens.json`, `semantic.tokens.json`, `typography.tokens.json`, `themes/{light,dark}.tokens.json` |
| Tokens as CSS (generated, never edit) | `tokens/build/tokens.css`, `tokens/build/themes.css` |
| Fonts | `fonts/` (woff2, licences, `fonts.css`) |
| App UI components (React) | `ui/primitives/<Name>/`, `ui/composites/<Name>/`; barrel export `ui/index.ts` |
| Component specs (props, variants, a11y, when to use) | `components/<Name>.md` for `ui`, `components/ig-<name>.md` for infographic |
| Infographic vocabulary (allowed `ig-*` classes, variants, data props) | `infographic/manifest.ts` (`COMPONENTS`) |
| Infographic CSS | `infographic/components.css`, `infographic/css/*.css` |
| Fragment validation / document build | `infographic/validate.ts` (`validateFragment`), `infographic/render.ts` (`buildDocument`), `infographic/document.ts` (locales, themes, CSP) |
| Charts (zod specs, layout, SVG render, `expand.ts`) | `charts/` (entry `charts/index.ts`); plan in `../CHART_LIBRARY_PLAN.md` |
| Reference infographics | `examples/<name>.<locale>.html` and `<name>.charts.<locale>.json` |
| Visual catalogs (private routes) | `catalog/registry.ts`, `catalog/sections/` |
| Test reports | `reports/` (`shots/` is gitignored) |

## Naming conventions

- **CSS custom properties**: `--ds-<group>-<name>`. Groups: `color` (primitives), `surface`, `text`, `border`, `accent`, `danger`, `focus`, `radius`, `spacing`, `font`, `type` (typography scale), `chart`, `data`, `on`. Prefer semantic groups over `--ds-color-*` primitives in components.
- **Themes**: light and dark override the semantic tokens only; never hard-code a colour.
- **Infographic classes**: BEM with an `ig-` prefix: `ig-<block>`, `ig-<block>__<element>`, `ig-<block>--<variant>`. Charts are `ig-chart` plus `ig-chart-<type>`.
- **Chart ids**: match `CHART_ID_PATTERN` (`/^[a-z][a-z0-9-]{0,31}$/`), referenced via the `data-chart` attribute.
- **React components**: PascalCase folder per component with `<Name>.tsx`, `<Name>.module.css` and `index.ts`.
- **Locales**: `es` and `en`. Files are `<name>.<locale>.<ext>`. Component specs are in Spanish.

## Rules for agents

- Change tokens only in the JSON sources, then run `pnpm tokens:build` (`tokens:check` verifies, `contrast:check` checks AA contrast).
- Before using or changing a component, read its spec in `components/`. When adding or changing an `ig-*` component, update `infographic/manifest.ts` and its spec together.
- Infographic markup must pass `validateFragment`; only classes listed in the manifest are allowed.
- Plan and progress: `../DESIGN_SYSTEM_PLAN.md`. Product context: `../FUNCTIONAL_SPEC.md`.
