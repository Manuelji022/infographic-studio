# Block selection and local editing: E2E report

Run: 2026-11-02T15:37:53.869Z against http://localhost:3000. 60/60 checks passed.

Command: `node scripts/dev/blocks-e2e.mjs` (dev server on :3000, Chrome headless over CDP). Screenshots: `design-system/reports/shots/ui-blocks/`.

Note: the sample chart of `pensiones` already is a line chart, so scenario A asks for columns first, then for lines, and undoes both. Scenario B asks for a comparison with the previous year (no data) and for lines on a line chart: both leave the document untouched.

| Scenario | Check | Result |
|---|---|---|
| pensiones-1280 | a chart block root exists in the iframe DOM with data-block-id | PASS |
| pensiones-1280 | iframe stays sandbox="allow-same-origin" (no allow-scripts) | PASS |
| pensiones-1280 | no script is injected in the iframe document | PASS |
| pensiones-1280 | at rest nothing is drawn over the document | PASS |
| pensiones-1280 | hover shows the type label and the three actions | PASS |
| pensiones-1280 | click selects: the context chip names the chart | PASS |
| pensiones-1280 | selection is announced (aria-live blockSelected) | PASS |
| pensiones-1280 | selecting moves the focus to the chat input | PASS |
| A-to-columns | only that block shows the working veil while the edit runs | PASS |
| A-to-columns | reply says exactly 1 block was updated | PASS |
| A-to-columns | reply lists exactly the selected block | PASS |
| A-to-columns | the chart block changed and every other root is byte-identical (only its ancestors, which contain it, differ) | PASS |
| A-to-columns | the selection survives the edit | PASS |
| A-to-columns | Undo is offered in the chat reply | PASS |
| A-to-columns | Undo is offered in the block toolbar | PASS |
| A-to-columns | the stored document changed (download differs) | PASS |
| A-to-columns | another infographic is untouched | PASS |
| A-to-columns | the original chart is a line chart and now it is a column chart | PASS |
| A-to-lines | only that block shows the working veil while the edit runs | PASS |
| A-to-lines | the chart is a line chart again | PASS |
| A-to-lines | reply lists exactly the selected block | PASS |
| A-to-lines | the chart block changed and every other root is byte-identical | PASS |
| A-undo | after the first undo the document equals the state before the second edit | PASS |
| A-undo | after the second undo every block is byte-identical to the original | PASS |
| A-undo | the stored document is byte-identical to the original (download hash) | PASS |
| B-not-possible | reply explains it is not possible | PASS |
| B-not-possible | no Undo and no changed-block chips on that reply | PASS |
| B-not-possible | no block changed | PASS |
| B-not-possible | the stored document is untouched (download hash) | PASS |
| B-not-possible | asking for a line chart when it already is one is refused, not faked | PASS |
| esc | Esc deselects (context chip gone) | PASS |
| chips | a changed-block chip selects that block (context chip appears) | PASS |
| chips | global edit undone to the original | PASS |
| keyboard | arrow keys move through the block list (outside the iframe) | PASS |
| keyboard | the navigator is reachable by Tab (tabindex=0, listbox, labelled) | PASS |
| keyboard | the previewed block is outlined in the layer | PASS |
| keyboard | Enter selects the block (context chip shown) | PASS |
| comments | chat lists the notes of the selected block (empty text when there are none) | PASS |
| comments | the comment popover opens with the field focused | PASS |
| comments | saving a note shows a numeric badge on the block | PASS |
| comments | the note is listed in the chat for the selected block | PASS |
| comments | notes persist in the mock store across a reload (badge back after reload) | PASS |
| regenerate | regenerate visibly changes the selected block and nothing else | PASS |
| regenerate | reply has Undo and lists that block | PASS |
| regenerate | undo restores the exact original document | PASS |
| comment-footer-1280 | the infographic has a footer block | PASS |
| comment-footer-1280 | the comment popover on the footer is fully inside the overlay layer (textarea and buttons visible) | PASS |
| touch-360-light | touch layout: no hover toolbar at rest | PASS |
| touch-360-light | tap selects and shows the bottom action bar | PASS |
| touch-360-light | the bar offers Comment / Edit with AI / Regenerate | PASS |
| touch-360-light | selecting by tap does not open the chat or raise the keyboard | PASS |
| touch-360-light | no horizontal overflow at 360 px | PASS |
| touch-360-light | the comment popover is a bottom sheet inside the viewport | PASS |
| touch-360-light | Esc closes the comment popover first (block stays selected) | PASS |
| touch-360-light | Edit with AI opens the chat sheet with the context chip | PASS |
| touch-360-dark | touch layout: no hover toolbar at rest | PASS |
| touch-360-dark | tap selects and shows the bottom action bar | PASS |
| touch-360-dark | the bar offers Comment / Edit with AI / Regenerate | PASS |
| touch-360-dark | selecting by tap does not open the chat or raise the keyboard | PASS |
| touch-360-dark | no horizontal overflow at 360 px | PASS |
