# Mockup tour E2E

Base: http://localhost:3000  ·  generated infographic: gen-da725a91  ·  11/11 checks passed

Command: `node scripts/dev/tour-e2e.mjs` (dev server on :3000, Chrome headless over CDP).

| Scenario | Check | Result | Detail |
| --- | --- | --- | --- |
| login | the fake session cookie opens / without redirect to /login | PASS | path=/, composer=true |
| generate | the mock generation redirects to /i/<new id> (not pensiones) | PASS | /i/gen-da725a91 (type=Artículo) |
| workspace | the iframe shows data-block-id blocks and the chat is visible at 1280 px | PASS | 12 bloques, chat 360x844 visible=true, viewport 1280px, design-system/reports/tour-e2e/workspace-1280.png |
| select | one block is selected (context chip) and the download is saved as "before" | PASS | selected chart-4 (Gráfico: Gasto anual en pensiones); before: 12 bloques |
| edit | the chat edit reports exactly 1 changed block (the selected one) with Undo | PASS | Studio /  / He actualizado 1 bloque: /  / Gasto anual en pensiones / Deshacer · chips=["Gasto anual en pensiones"] |
| scope | after the edit only the selected block differs in the download | PASS | 1 bloque cambiado: chart-4 (seleccionado: chart-4; bloques 12→12) |
| undo | Undo in the bar returns the download to the exact "before" HTML | PASS | HTML identico al de antes |
| share | the share dialog creates a link with a new token (not demo-*) | PASS | /s/ccbb078b094d4ae1af46fc45d45ced2ed64355cc |
| public | the public link opens without a session cookie and shows the infographic | PASS | title="El envejecimiento eleva la presión sobre las pensiones", iframe present, session cookie absent |
| 404 | an unknown token answers HTTP 404 | PASS | HTTP 404 |
| 404 | a revoked token (demo-revocada) answers HTTP 404 | PASS | HTTP 404 |

## Screenshots
- workspace-1280.png
- shared-public.png
