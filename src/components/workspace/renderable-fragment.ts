import { parseAttributes } from "../../mocks/blocks.ts";

/**
 * A stored chart hole carries its block id (`<div data-block-id="chart-3" class="ig-chart" …>`),
 * in any attribute order. expandCharts replaces the hole with a figure that has no room for the
 * id, so the hole is rewritten as a wrapper div that carries the id around a canonical hole
 * (`class` then `data-chart`). The wrapper keeps the chart reachable as a block in the iframe.
 */
const DIV_WITHOUT_CHILDREN = /<div((?:"[^"]*"|'[^']*'|[^'">])*)><\/div>/g;

export function renderableFragment(html: string): string {
  return html.replace(DIV_WITHOUT_CHILDREN, (match, attrs: string) => {
    const list = parseAttributes(attrs);
    const classes = (list.find((attr) => attr.name === "class")?.value ?? "").split(/\s+/);
    const chartId = list.find((attr) => attr.name === "data-chart")?.value;
    if (!classes.includes("ig-chart") || !chartId || !/^[a-z][a-z0-9-]*$/.test(chartId)) return match;
    const hole = `<div class="ig-chart" data-chart="${chartId}"></div>`;
    const blockId = list.find((attr) => attr.name === "data-block-id")?.value;
    if (!blockId) return hole;
    return `<div data-block-id="${blockId.replaceAll('"', "&quot;")}">${hole}</div>`;
  });
}
