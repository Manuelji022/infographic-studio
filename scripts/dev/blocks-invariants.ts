import { ensureBlockIds, parseBlocks, replaceBlock, scanElements, topLevelBlocks } from "../../src/mocks/blocks.ts";
import { applyInstruction } from "../../src/mocks/edit.ts";
import { renderableFragment } from "../../src/components/workspace/renderable-fragment.ts";
import { buildDocument } from "../../design-system/infographic/render.ts";
import { applyBlockInstruction } from "../../src/mocks/edit-block.ts";
import { getInfographic, pushEdit, moveHistory, putInfographic } from "../../src/mocks/store.ts";
import { validateChartSpec } from "../../design-system/charts/schema/index.ts";

let failures = 0;
const check = (label: string, ok: boolean, extra = "") => { if (!ok) failures++; console.log(`${ok ? "PASS" : "FAIL"} ${label}${extra ? " — " + extra : ""}`); };
const idsOf = (html: string) => parseBlocks(html).map((b) => b.id);
const unique = (ids: (string | null)[]) => new Set(ids).size === ids.length && ids.every(Boolean);

// 1. Seeds: ids present, unique, on every block root incl. charts; ensureBlockIds idempotent
for (const item of ["pensiones", "gasto-publico"]) for (const locale of ["es", "en"] as const) {
  const content = getInfographic(item)!.contents[locale]!;
  const ids = idsOf(content.html);
  check(`seed ${item}.${locale}: ids unique and present (${ids.length} blocks)`, unique(ids), ids.join(","));
  check(`seed ${item}.${locale}: chart blocks carry ids`, parseBlocks(content.html).filter((b) => b.type === "chart").every((b) => !!b.id));
  const again = ensureBlockIds(content.html, content.blockSeq, { charts: content.charts });
  check(`seed ${item}.${locale}: ensureBlockIds idempotent`, again.ok && again.html === content.html && again.seq === content.blockSeq);
}

// 2. Six instructions, cumulative on pensiones.es: ids stable, untouched blocks identical
const item = getInfographic("pensiones")!;
let content = item.contents.es!;
const steps: Array<[string, "changed" | "missing-data" | "unsupported" | "no-change"]> = [
  ["Hazla más ejecutiva", "changed"],
  ["Reduce el texto", "changed"],
  ["Estilo más minimalista", "changed"],
  ["Destaca las conclusiones", "changed"],
  ["cambia el estilo", "changed"],
  ["Añade comparación con 2022", "missing-data"],
];
for (const [instruction, expected] of steps) {
  const beforeHtml = content.html;
  const beforeTop = new Map(topLevelBlocks(beforeHtml, { charts: content.charts }).map((b) => [b.id, b.html]));
  const beforeIds = idsOf(beforeHtml);
  const out = applyInstruction(beforeHtml, instruction, content.charts, content.blockSeq);
  const actual = out.kind === "notPossible" ? out.reason : "changed";
  check(`"${instruction}" outcome is ${expected}`, actual === expected, `actual=${actual}`);
  if (out.kind === "notPossible") {
    check(`"${instruction}" refused: the stored fragment is untouched`, getInfographic("pensiones")!.contents.es!.html === item.contents.es!.html);
    continue;
  }
  const afterIds = idsOf(out.html);
  const removed = beforeIds.filter((id) => !afterIds.includes(id));
  const added = afterIds.filter((id) => !beforeIds.includes(id));
  check(`"${instruction}" ids unique`, unique(afterIds));
  check(`"${instruction}" no new ids`, added.length === 0, `added=${added}`);
  check(`"${instruction}" removed ids are nested only`, removed.every((id) => parseBlocks(beforeHtml).find((b) => b.id === id)!.nested), `removed=${removed}`);
  check(`"${instruction}" seq monotonic`, out.blockSeq >= content.blockSeq);
  const top = topLevelBlocks(out.html, { charts: content.charts });
  const untouched = top.filter((b) => beforeTop.has(b.id) && !out.changedBlocks.some((c) => c.id === b.id));
  check(`"${instruction}" untouched top-level blocks byte-identical`, untouched.every((b) => beforeTop.get(b.id) === b.html), `n=${untouched.length}`);
  check(`"${instruction}" reported blocks exist and changed`, out.changedBlocks.every((c) => top.some((t) => t.id === c.id) && beforeTop.get(c.id) !== top.find((t) => t.id === c.id)!.html), out.changedBlocks.map((c) => c.id).join(","));
  console.log(`   rules=${out.rules} changed=${out.changedBlocks.map((c) => c.id).join(",")}`);
  content = { ...content, html: out.html, blockSeq: out.blockSeq };
}

// 3. Data requests and unsupported text: always refused, never mutated
const base = getInfographic("pensiones")!.contents.es!;
for (const q of ["compare with 2019", "añade comparación con 2019", "inventa", "add forecast", "añade datos de 2022", "cambia algo", "add a quote from the author", "Compare with 2022"]) {
  const out = applyInstruction(base.html, q, base.charts, base.blockSeq);
  check(`refused "${q}"`, out.kind === "notPossible", out.kind === "notPossible" ? out.reason : "CHANGED");
}

// 4. Parser hardening
const good = `<section data-block-id="section-1" class="ig-section"><h2 class='ig-section__title'>T</h2><p class=ig-section__measure>m</p><img src=x alt=y><!-- <div> hidden --><div class="ig-card"><p class="ig-card__text">a</p></div></section>`;
const goodScan = scanElements(good);
check("quoted/unquoted/single attrs and void img accepted", goodScan.malformed === null, String(goodScan.malformed));
check("comment content ignored", parseBlocks(good).length === 1 && parseBlocks(good)[0].id === "section-1");
const unclosed = `<section class="ig-section"><h2 class="ig-section__title">T</h2>`;
check("unclosed fragment is malformed", scanElements(unclosed).malformed !== null);
const opaque = parseBlocks(unclosed);
check("unclosed → one opaque block", opaque.length === 1 && opaque[0].opaque === true);
check("replaceBlock refuses malformed", replaceBlock(unclosed, "section-1", "<section></section>").ok === false);
check("replaceBlock refuses dropping id", replaceBlock(good, "section-1", `<section class="ig-section"></section>`).ok === false);
check("replaceBlock keeps id ok", replaceBlock(good, "section-1", `<section data-block-id="section-1" class="ig-section"></section>`).ok === true);
check("stray closing tag malformed", scanElements(`<div class="ig-root"></span>`).malformed !== null);
check("<wbr> and <br> void", scanElements(`<p class="ig-card__text">a<br>b<wbr></p>`).malformed === null);

// 5. Undo/redo restore ids exactly (store history)
putInfographic({ ...getInfographic("pensiones")!, history: [], historyCursor: 0 });
let cur = getInfographic("pensiones")!.contents.es!;
const original = cur.html;
const snapshots: string[] = [original];
const ids: string[] = [];
for (const instruction of ["Hazla más ejecutiva", "Reduce el texto", "Destaca las conclusiones"]) {
  const out = applyInstruction(cur.html, instruction, cur.charts, cur.blockSeq);
  if (out.kind !== "changed") throw new Error("expected change");
  const entry = { id: `e-${ids.length}`, instruction, scope: "global" as const, blockIds: out.changedBlocks.map((b) => b.id), blockNames: out.changedBlocks.map((b) => b.name), createdAt: new Date().toISOString(),
    before: { es: { html: cur.html, charts: cur.charts, blockSeq: cur.blockSeq } }, after: { es: { html: out.html, charts: cur.charts, blockSeq: out.blockSeq } } };
  pushEdit("pensiones", entry);
  ids.push(entry.id);
  cur = getInfographic("pensiones")!.contents.es!;
  snapshots.push(cur.html);
}
for (let i = ids.length - 1; i >= 0; i--) moveHistory("pensiones", ids[i], "undo");
check("undo all → original html byte-identical", getInfographic("pensiones")!.contents.es!.html === original);
for (let i = 0; i < ids.length; i++) {
  moveHistory("pensiones", ids[i], "redo");
  check(`redo ${i + 1} → snapshot identical`, getInfographic("pensiones")!.contents.es!.html === snapshots[i + 1]);
}
const seqNow = getInfographic("pensiones")!.contents.es!.blockSeq;
check("id counter never decreases across undo", seqNow >= cur.blockSeq);


// 6. LOCAL (single-block) edits: only the target block changes, everything else is byte-identical
{
  putInfographic({ ...getInfographic("pensiones")!, history: [], historyCursor: 0 });
  const base = getInfographic("pensiones")!.contents.es!;
  const blocks = parseBlocks(base.html, { charts: base.charts });
  const chart = blocks.find((b) => b.type === "chart" && b.html.includes("data-chart="))!;
  const section = blocks.find((b) => b.type === "section" && !b.nested)!;
  const verdict = blocks.find((b) => b.type === "verdict")!;
  const htmlOutside = (html: string, id: string) => parseBlocks(html, { charts: base.charts }).filter((b) => b.id !== id && !b.nested).map((b) => b.html);

  const toColumn = applyBlockInstruction(base.html, base.charts, base.blockSeq, chart.id!, "cambia a columnas");
  check("chart → column: changed", toColumn.kind === "changed");
  if (toColumn.kind === "changed") {
    check("chart → column: fragment html byte-identical", toColumn.html === base.html);
    check("chart → column: only the edited spec differs", toColumn.charts.every((spec, i) => (i === 0) === (JSON.stringify(spec) !== JSON.stringify(base.charts[i]))) && (toColumn.charts[0] as { type: string }).type === "column");
    check("chart → column: reports exactly the edited block", toColumn.block.id === chart.id);
    const back = applyBlockInstruction(toColumn.html, toColumn.charts, toColumn.blockSeq, chart.id!, "cambia a gráfico de líneas");
    check("column → line: changed", back.kind === "changed" && (back.charts[0] as { type: string }).type === "line");
  }
  const lineOnLine = applyBlockInstruction(base.html, base.charts, base.blockSeq, chart.id!, "cambia a gráfico de líneas");
  check("line → line is refused as no-change (never fake success)", lineOnLine.kind === "notPossible" && lineOnLine.reason === "no-change", JSON.stringify(lineOnLine).slice(0, 80));
  for (const q of ["compara con el año anterior", "añade datos interanual", "show year over year", "añade 2022"]) {
    const out = applyBlockInstruction(base.html, base.charts, base.blockSeq, chart.id!, q);
    check(`chart "${q}" refused as missing-data`, out.kind === "notPossible" && out.reason === "missing-data");
  }
  const noStyle = applyBlockInstruction(base.html, base.charts, base.blockSeq, chart.id!, "haz algo raro");
  check("chart unknown instruction refused as unsupported", noStyle.kind === "notPossible" && noStyle.reason === "unsupported");
  const missing = applyBlockInstruction(base.html, base.charts, base.blockSeq, "nope-99", "acorta");
  check("unknown block id refused", missing.kind === "notPossible");

  const short = applyBlockInstruction(base.html, base.charts, base.blockSeq, section.id!, "acorta el texto");
  check("section 'acorta': changed", short.kind === "changed");
  if (short.kind === "changed") {
    check("section edit: every other top-level block byte-identical", JSON.stringify(htmlOutside(short.html, section.id!)) === JSON.stringify(htmlOutside(base.html, section.id!)));
    check("section edit: chart specs byte-identical", JSON.stringify(short.charts) === JSON.stringify(base.charts));
    check("section edit: ids unchanged and in order", JSON.stringify(idsOf(short.html)) === JSON.stringify(idsOf(base.html)));
  }
  const v = applyBlockInstruction(base.html, base.charts, base.blockSeq, verdict.id!, "make it shorter");
  check("verdict 'shorter': changed or honestly refused", v.kind === "changed" || v.reason === "no-change");
  const variant = applyBlockInstruction(base.html, base.charts, base.blockSeq, section.id!, "", { variant: true });
  check("variant on a section changes something", variant.kind === "changed" && variant.html !== base.html);

  // history: a block edit pushed to the store is undone to the exact original
  if (toColumn.kind === "changed") {
    const entry = { id: "blk-1", instruction: "cambia a columnas", scope: "block" as const, blockIds: [chart.id!], blockNames: [chart.name], createdAt: new Date().toISOString(),
      before: { es: { html: base.html, charts: base.charts, blockSeq: base.blockSeq } }, after: { es: { html: toColumn.html, charts: toColumn.charts, blockSeq: toColumn.blockSeq } } };
    pushEdit("pensiones", entry);
    check("store holds the new chart spec", (getInfographic("pensiones")!.contents.es!.charts[0] as { type: string }).type === "column");
    moveHistory("pensiones", "blk-1", "undo");
    const undone = getInfographic("pensiones")!.contents.es!;
    check("undo → html and charts byte-identical to the original", undone.html === base.html && JSON.stringify(undone.charts) === JSON.stringify(base.charts));
  }
}


// 7. U5 review findings
{
  // (a) attribute text inside a quoted value is not an attribute
  const trap = `<section title="example data-block-id=section-99" class="ig-section"><h2 class="ig-section__title">T</h2></section>`;
  check("(a) data-block-id inside a quoted value is not read as an id", parseBlocks(trap)[0].id === null);
  const minted = ensureBlockIds(trap, 0);
  check("(a) ensureBlockIds mints a real id for it", minted.ok && parseBlocks(minted.html)[0].id === "section-1" && minted.html.includes('title="example data-block-id=section-99"'));
  check("(a) class inside another value is not read either", parseBlocks(`<div title="x class=ig-section" class="ig-card"></div>`)[0].type === "text");
  check("(a) a real id is still read, in any quote style", parseBlocks(`<section class=ig-section data-block-id='s-1'></section>`)[0].id === "s-1");
  // (b) a trailing slash only self-closes void elements
  const slash = scanElements(`<section class="ig-section" />`);
  check("(b) <section/> is a normal open tag: an unclosed fragment is malformed, never silently balanced", slash.malformed !== null);
  check("(b) <section/>…</section> balances like a browser would", scanElements(`<section class="ig-section" /><p>x</p></section>`).malformed === null);
  check("(b) void <br/> and <img />", scanElements(`<p>a<br/>b<img src=x /></p>`).malformed === null);
  // (c) refusal heuristics
  const base0 = getInfographic("pensiones")!.contents.es!;
  const verdictFor = (text: string) => { const out = applyInstruction(base0.html, text, base0.charts, base0.blockSeq); return out.kind === "notPossible" ? out.reason : "changed"; };
  check("(c) 'Make the 2024 heading more concise' reaches the style logic", verdictFor("Make the 2024 heading more concise") !== "missing-data", verdictFor("Make the 2024 heading more concise"));
  check("(c) 'Haz más minimalista la comparación' reaches the style logic", verdictFor("Haz más minimalista la comparación") !== "missing-data", verdictFor("Haz más minimalista la comparación"));
  check("(c) 'Use a fabric texture background' is unsupported, not missing-data and not a fake success", verdictFor("Use a fabric texture background") === "unsupported", verdictFor("Use a fabric texture background"));
  for (const q of ["compara con 2019", "Compare with 2022", "versus last year", "añade datos de 2022", "show 2021 figures", "análisis interanual", "forecast 2030", "inventa una cifra", "add a year over year view"]) {
    check(`(c) "${q}" still refused as missing-data`, verdictFor(q) === "missing-data", verdictFor(q));
  }
  // (d) chart wrapping does not depend on attribute order
  const spec = base0.charts[0] as { id: string };
  const holes = [
    `<div data-block-id="chart-3" class="ig-chart" data-chart="${spec.id}"></div>`,
    `<div class="ig-chart" data-chart="${spec.id}" data-block-id="chart-3"></div>`,
    `<div data-chart="${spec.id}" data-block-id="chart-3" class="ig-chart"></div>`,
    `<div data-block-id='chart-3' class='ig-chart' data-chart='${spec.id}'></div>`,
  ];
  for (const hole of holes) {
    const wrapped = renderableFragment(hole);
    check(`(d) wrapped canonical: ${hole.slice(5, 40)}…`, wrapped === `<div data-block-id="chart-3"><div class="ig-chart" data-chart="${spec.id}"></div></div>`, wrapped);
    const doc = buildDocument(wrapped, { locale: "es", theme: "auto", dsVersion: "1.0.0", embed: true, title: "t", charts: base0.charts });
    check("(d) …and the chart expands inside the id wrapper", doc.includes('data-block-id="chart-3"') && !doc.includes('data-chart="' + spec.id + '"></div>') && doc.includes("<svg"));
  }
}

// 8. U6 fixes: nested blocks, shared chart specs, chart schema bounds
{
  const base = getInfographic("pensiones")!.contents.es!;
  const nestedById = (html: string, charts: readonly unknown[]) =>
    new Map(parseBlocks(html, { charts: charts as unknown[] }).filter((b) => b.nested).map((b) => [b.id, b.html] as const));
  const chartOf = (html: string, charts: readonly unknown[]) =>
    parseBlocks(html, { charts: charts as unknown[] }).find((b) => b.type === "chart" && b.html.includes("data-chart="))!;
  const specIdOf = (blockHtml: string) => /data-chart="([^"]+)"/.exec(blockHtml)![1];

  // (a) a text edit on a section never touches the nested blocks (stat, chart, callouts) inside it
  for (const sectionId of ["section-2", "section-7"]) {
    const nestedBefore = nestedById(base.html, base.charts);
    let changedAny = false;
    for (const instruction of ["acorta el texto", "Hazla más ejecutiva", "Estilo más minimalista", "Destaca las conclusiones"]) {
      const out = applyBlockInstruction(base.html, base.charts, base.blockSeq, sectionId, instruction);
      if (out.kind !== "changed") continue;
      changedAny = true;
      const nestedAfter = nestedById(out.html, out.charts);
      const same = nestedAfter.size === nestedBefore.size && [...nestedBefore].every(([id, html]) => nestedAfter.get(id) === html);
      check(`(8a) "${instruction}" on ${sectionId}: every nested block is byte-identical`, same, `nested=${[...nestedBefore.keys()].join(",")}`);
    }
    check(`(8a) ${sectionId} has nested blocks and an edit changes its own text`, nestedBefore.size > 0 && changedAny);
  }

  // (b) two holes on one spec: editing one gives it a copy; the other hole and its spec stay as they were
  {
    const chart = chartOf(base.html, base.charts);
    const specId = specIdOf(chart.html);
    const twin = chart.html.replace(/data-block-id="[^"]*"/, 'data-block-id="chart-99"');
    const shared = base.html.replace(chart.html, `${chart.html}${twin}`);
    const out = applyBlockInstruction(shared, base.charts, base.blockSeq, "chart-99", "cambia a columnas");
    check("(8b) shared spec: editing one hole is changed", out.kind === "changed", out.kind === "notPossible" ? out.reason : "");
    if (out.kind === "changed") {
      const after = parseBlocks(out.html, { charts: out.charts });
      const other = after.find((b) => b.id === chart.id)!;
      const edited = after.find((b) => b.id === "chart-99")!;
      check("(8b) the other hole is byte-identical", other.html === chart.html);
      const originalBefore = base.charts.find((s) => (s as { id: string }).id === specId);
      const originalAfter = out.charts.find((s) => (s as { id: string }).id === specId);
      check("(8b) the shared spec itself is unchanged", JSON.stringify(originalAfter) === JSON.stringify(originalBefore));
      const editedSpecId = specIdOf(edited.html);
      check("(8b) the edited hole points at a new, schema-valid id", editedSpecId !== specId && /^[a-z][a-z0-9-]{0,31}$/.test(editedSpecId), editedSpecId);
      check("(8b) the copy is a column chart", out.charts.some((s) => (s as { id: string; type: string }).id === editedSpecId && (s as { type: string }).type === "column"));
      check("(8b) spec ids stay unique", new Set(out.charts.map((s) => (s as { id: string }).id)).size === out.charts.length);
    }
  }

  // (c) a 120-character title is cut back to the limit with an ellipsis, and the stored spec is valid
  {
    const chart = chartOf(base.html, base.charts);
    const specId = specIdOf(chart.html);
    const title = "Gasto de pensiones por tipo y año, desglose completo del periodo ".padEnd(120, "x").slice(0, 120);
    const labels = Array.from({ length: 13 }, (_, i) => `Año ${2010 + i}`);
    // 13 x-values: no column version exists (max 12) and the variant falls back to the title.
    const longSpec = {
      id: specId,
      type: "line",
      title,
      sourceQuote: (base.charts.find((s) => (s as { id: string }).id === specId) as { sourceQuote: string }).sourceQuote,
      x: { kind: "category", values: labels },
      series: [{ name: "Gasto", values: labels.map((_, i) => 100 + i) }],
    };
    const charts = base.charts.map((s) => ((s as { id: string }).id === specId ? longSpec : s));
    check("(8c) the 120-character title fixture is valid before the edit", validateChartSpec(longSpec).ok);
    const out = applyBlockInstruction(base.html, charts, base.blockSeq, chart.id!, "", { variant: true });
    check("(8c) variant on a 120-character title: changed", out.kind === "changed", out.kind === "notPossible" ? out.reason : "");
    if (out.kind === "changed") {
      const stored = out.charts.find((s) => (s as { id: string }).id === specId) as { title: string };
      check("(8c) stored title is within 120 characters and ends with an ellipsis", stored.title.length <= 120 && stored.title.endsWith("…"), `len=${stored.title.length}`);
      check("(8c) the stored spec passes the chart schema", validateChartSpec(stored).ok);
    }
  }

  // (d) an edit whose result fails the chart schema is refused and stores nothing
  {
    const chart = chartOf(base.html, base.charts);
    const specId = specIdOf(chart.html);
    const spec = base.charts.find((s) => (s as { id: string }).id === specId) as { series: Array<{ values: number[] }> };
    const broken = { ...spec, series: spec.series.map((item) => ({ ...item, values: item.values.map(() => 2e15) })) };
    const charts = base.charts.map((s) => ((s as { id: string }).id === specId ? broken : s));
    const out = applyBlockInstruction(base.html, charts, base.blockSeq, chart.id!, "cambia a columnas");
    check("(8d) a result that fails the schema is refused as invalid-spec", out.kind === "notPossible" && out.reason === "invalid-spec", out.kind === "notPossible" ? out.reason : "CHANGED");
  }
}

console.log(failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`);
process.exitCode = failures ? 1 : 0;
