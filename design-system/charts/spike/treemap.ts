type Item = { es: string; en: string; value: number; group: string; color: string };
export const groups = [
  { id: "social", es: "Protección social", en: "Social protection",
    color: "var(--ds-color-yellow)", items: [
    ["Pensiones e I.T.", "Pensions and disability", 25.6], ["Desempleo", "Unemployment", 4.9],
    ["Resto protección social", "Other social protection", 1.3],
    ["Familia e hijos", "Family and children", 1.1],
  ] },
  { id: "services", es: "Servicios", en: "Services", color: "var(--ds-data-2)", items: [
    ["Sanidad", "Health", 12.2], ["Educación", "Education", 9.9],
  ] },
  { id: "debt", es: "Deuda", en: "Debt", color: "var(--ds-color-red)", items: [
    ["Intereses de la deuda", "Debt interest", 12],
  ] },
  { id: "economy", es: "Economía", en: "Economy", color: "var(--ds-data-5)", items: [
    ["Transporte", "Transport", 6], ["Asuntos económicos", "Economic affairs", 4.6],
    ["I+D", "R&D", 2.3],
  ] },
  { id: "state", es: "Estado", en: "State", color: "var(--ds-surface-deep)", items: [
    ["Serv. públicos generales", "General public services", 5.9],
    ["Orden público", "Public order", 4.3], ["Defensa", "Defence", 2.8],
  ] },
  { id: "other", es: "Otros", en: "Other", color: "var(--ds-surface-deep)", items: [
    ["Ocio, cultura y religión", "Recreation, culture and religion", 3],
    ["Vivienda y urbanismo", "Housing", 2.3], ["Medio ambiente", "Environment", 1.8],
  ] },
] as const;
const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;");

// Bruls squarify: add items while the worst rectangle aspect ratio improves.
function layout(items: Item[], width: number, height: number) {
  const scale = width * height / items.reduce((sum, item) => sum + item.value, 0);
  const pending = items.map((item) => ({ ...item, area: item.value * scale }));
  const placed: Array<{ item: Item; x: number; y: number; w: number; h: number }> = [];
  let x = 0, y = 0, w = width, h = height;
  const worst = (row: typeof pending, side: number) => {
    const sum = row.reduce((a, b) => a + b.area, 0);
    return Math.max(side * side * Math.max(...row.map((a) => a.area)) / (sum * sum),
      sum * sum / (side * side * Math.min(...row.map((a) => a.area))));
  };
  while (pending.length) {
    const row: typeof pending = [];
    const side = Math.min(w, h);
    while (pending.length &&
      (!row.length || worst([...row, pending[0]], side) <= worst(row, side))) {
      row.push(pending.shift()!);
    }
    const sum = row.reduce((a, b) => a + b.area, 0);
    if (w >= h) {
      const rw = sum / h; let cy = y;
      for (const item of row) {
        const rh = item.area / rw;
        placed.push({ item, x, y: cy, w: rw, h: rh });
        cy += rh;
      }
      x += rw; w -= rw;
    } else {
      const rh = sum / w; let cx = x;
      for (const item of row) {
        const rw = item.area / rh;
        placed.push({ item, x: cx, y, w: rw, h: rh });
        cx += rw;
      }
      y += rh; h -= rh;
    }
  }
  return placed;
}
// Approximate Geist advances in em, with a 10% reserve for shaping and rounding.
// Wide glyphs must not be treated like average lowercase letters.
function textWidth(text: string, size: number): number {
  return [...text].reduce((sum, char) => {
    const em = /[MWmw@%]/.test(char) ? 1 : /[ilI.,' :!]/.test(char) ? 0.32 : 0.65;
    return sum + em * size * 1.1;
  }, 0);
}

function wrapLines(text: string, width: number, size: number): number {
  let lines = 1;
  let used = 0;
  for (const word of text.split(/\s+/)) {
    const advance = textWidth(word, size);
    if (advance > width) return Infinity;
    const gap = used ? textWidth(" ", size) : 0;
    if (used + gap + advance > width) {
      lines += 1;
      used = advance;
    } else {
      used += gap + advance;
    }
  }
  return lines;
}

export function renderTreemapSpike(data: unknown, locale: "es" | "en"): string {
  void data;
  const nf = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const flat: Item[] = groups.flatMap((g) => g.items.map(([es, en, value]) => ({
    es, en, value, group: locale === "es" ? g.es : g.en,
    color: g.color,
  })));
  const variants = (["wide", "narrow"] as const).map((variant) => {
    const width = variant === "wide" ? 100 : 75, height = variant === "wide" ? 75 : 100;
    const groupItems = groups.map((group) => {
      const items = flat.filter((item) => item.group === (locale === "es" ? group.es : group.en));
      return {
        es: group.es, en: group.en,
        value: items.reduce((sum, item) => sum + item.value, 0), group: "", color: "",
      };
    });
    const groupBoxes = layout(groupItems, width, height);
    const omittedItems: string[] = [];
    const boxes = groups.flatMap((group, groupIndex) => {
      const items = flat.filter((item) => item.group === (locale === "es" ? group.es : group.en));
      const gbox = groupBoxes[groupIndex];
      const children = layout(items, gbox.w, gbox.h);
      return children.map(({ item, x, y, w, h }) => {
        const absX = gbox.x + x, absY = gbox.y + y;
        const label = locale === "es" ? item.es : item.en;
        const narrow = variant === "narrow";
        const actualWidth = narrow ? 328 : 880;
        // Include both borders and padding; keep these in sync with treemap.css.
        const inset = narrow ? 12 : 20;
        const cellWidth = w / width * actualWidth - inset;
        const actualHeight = actualWidth * (narrow ? 4 / 3 : 3 / 4);
        const cellHeight = h / height * actualHeight - inset;
        const large = w / width >= 0.2;
        const nameSize = narrow ? 10 : 12;
        const valueSize = large ? 20 : narrow ? 11 : 12;
        const value = `${nf.format(item.value)} %`;
        const nameLines = wrapLines(label, cellWidth, nameSize);
        const valueFits = textWidth(value, valueSize) <= cellWidth &&
          valueSize * 1.2 <= cellHeight;
        const showName = valueFits && Number.isFinite(nameLines) &&
          nameLines * nameSize * 1.2 + 3 + valueSize * 1.2 <= cellHeight;
        const showValue = valueFits;
        const soft = group.id === "social" && item.value !== 25.6;
        const bg = soft ? "var(--ds-color-yellow-pale)" : item.color;
        const omitted = !showValue;
        if (omitted) omittedItems.push(`${esc(label)} ${value}`);
        const cellText = `${showName ? `<span>${esc(label)}</span>` : ""}` +
          `${showValue ? `<b>${value}</b>` : ""}`;
        return `<div class="tm-cell tm-${group.id} ${large ? "tm-large" : ""} ` +
          `${group.id === "social" ? "tm-yellow" : ""}" ` +
          `style="left:${absX / width * 100}%;top:${absY / height * 100}%;` +
          `width:${w / width * 100}%;height:${h / height * 100}%;--cell:${bg}">` +
          `${cellText}</div>`;
      });
    }).join("");
    const alsoLabel = locale === "es" ? "También:" : "Also:";
    const also = omittedItems.length
      ? `<p class="tm-also">${alsoLabel} ${omittedItems.join(", ")}</p>` : "";
    return `<div class="tm-variant tm-${variant}"><div class="tm-layout" ` +
      `aria-hidden="true">${boxes}</div>${also}</div>`;
  }).join("");
  const title = locale === "es"
    ? "Las pensiones ya absorben una cuarta parte del gasto público"
    : "Pensions already take a quarter of public spending";
  const desc = locale === "es"
    ? "Peso de cada función en el gasto de las AA. PP., España, 1996 (% del gasto total)"
    : "Share of each function in general government spending, Spain, 1996 (% of total spending)";
  const hidden = flat.map((item) =>
    `<tr><th>${esc(locale === "es" ? item.es : item.en)}</th>` +
    `<td>${nf.format(item.value)} %</td></tr>`,
  ).join("");
  const legend = groups.map((g) =>
    `<span style="--legend:${g.color}">${esc(locale === "es" ? g.es : g.en)}</span>`,
  ).join("");
  return `<section class="tm" role="img" aria-labelledby="tm-title tm-desc">` +
    `<h1 id="tm-title">${esc(title)}</h1><p id="tm-desc">${esc(desc)}</p>` +
    `<div class="tm-chart">${variants}</div><p class="tm-period">1996</p>` +
    `<div class="tm-legend">${legend}</div><table class="tm-hidden">` +
    `<caption>${esc(desc)}</caption><tbody>${hidden}</tbody></table></section>`;
}
