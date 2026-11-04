# History panel E2E

Base: http://localhost:3000  ·  37/37 checks passed

| Scenario | Check | Result | Detail |
| --- | --- | --- | --- |
| history-1280 | starts at the original version (undo disabled, reset first if an earlier run left edits) | PASS | reset from earlier edits |
| history-1280 | seed document loaded | PASS | 10 blocks |
| history-1280 | edit 1 (global) is applied | PASS | Studio /  / He actualizado 1 bloque: /  / Pensiones e I.T. / Deshacer |
| history-1280 | edit 1 changed the stored document | PASS |  |
| history-1280 | a leaf text block exists for the block edit | PASS | header-1 |
| history-1280 | edit 2 (block) is applied to exactly 1 block | PASS | Studio /  / He actualizado 1 bloque: /  / La protección social se llevaba un tercio del gasto púb… / Deshacer |
| history-1280 | edit 2 changed the stored document | PASS |  |
| history-1280 | edit 2 changed the selected block root | PASS | ["header-1"] |
| history-1280 | edit 3 (global) is applied | PASS | Studio /  / He actualizado 1 bloque: /  / Pensiones e I.T. / Deshacer |
| history-1280 | edit 3 changed the stored document | PASS |  |
| history-1280 | panel lists 3 edits plus the original version | PASS | 4 rows |
| history-1280 | newest edit is first and is the current state | PASS | Infografía completa / 4 nov 2026, 12:41 / Versión actual /  / Destaca las conclusiones /  / Bloques afectados: Pensiones e I.T. |
| history-1280 | rows follow the edit order newest first | PASS | ["4 nov 2026, 12:41","4 nov 2026, 12:41","4 nov 2026, 12:41","Restaurar"] |
| history-1280 | the block edit row names the affected block | PASS | Bloque / 4 nov 2026, 12:41 /  / Estilo más minimalista /  / Bloques afectados: La protección social se llevaba un tercio del gasto púb… /  / Restaurar |
| history-1280 | original version is the last row and is restorable | PASS |  |
| history-1280 | every non-current row has a Restore button | PASS |  |
| history-1280 | restore announces "Versión restaurada." in the panel live region | PASS | Versión restaurada. |
| history-1280 | restored document is byte-identical to the snapshot after edit 1 (download hash) | PASS | ce435:292052 vs ce435:292052 |
| history-1280 | restored document equals the snapshot after edit 1 per data-block-id root | PASS | [] |
| history-1280 | after restoring, the current marker is on the first edit | PASS | other,other,current,other |
| history-1280 | later entries stay in the list (redo tail kept, 4 rows) | PASS | 4 rows |
| history-1280 | redo is still possible after restoring to edit 1 | PASS |  |
| history-1280 | restoring to the original gives the pristine seed (download hash) | PASS | 79a9d:292122 vs 79a9d:292122 |
| history-1280 | restoring to the original gives the pristine seed per data-block-id root | PASS | [] |
| history-1280 | original is now the current state | PASS |  |
| history-1280 | undo is disabled at the original version | PASS |  |
| history-1280 | redo is possible from the original | PASS |  |
| history-1280 | restoring forward to the newest edit gives its snapshot (download hash) | PASS |  |
| history-1280 | focus returns to the More trigger when the panel closes | PASS |  |
| history-1280 | redo possible before the new edit | PASS |  |
| history-1280 | new edit after restoring is applied | PASS | Studio /  / He actualizado 1 bloque: /  / Pensiones e I.T. / Deshacer |
| history-1280 | a new edit truncates the redo tail (redo disabled) | PASS |  |
| history-1280 | after truncation the list is new edit, edit 1, original (3 rows; block and edit 2 gone) | PASS | ["Infografía completa / 4 nov 2026, 12:41 / Versión actual /  / Destaca las conclusiones de nuevo /  / Bloques afectados: Pensiones e I.T.","Infografía completa / 4 nov 2026, 12:41 /  / Reduce el texto /  / Bloques afectados: Pensiones e I.T. /  / Restaurar","Versión original / Restaurar"] |
| history-360 | no horizontal overflow in the panel at 360 px | PASS |  |
| polish | Escape pressed inside the iframe closes the mobile chat overlay | PASS |  |
| polish | bar chat toggle is named "Abrir el chat" when the chat is closed | PASS | Abrir el chat |
| polish | the chat panel close button is not named like the bar toggle | PASS | ["Cerrar",null,null,null,null,"Enviar"] |

## Screenshots
- light1280: design-system/reports/shots/ui-history/panel-1280-light.png
- dark1280: design-system/reports/shots/ui-history/panel-1280-dark.png
- light360: design-system/reports/shots/ui-history/panel-360-light.png
- dark360: design-system/reports/shots/ui-history/panel-360-dark.png
