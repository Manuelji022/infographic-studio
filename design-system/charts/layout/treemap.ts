export type TreemapItem = { value: number; group?: string };
export type TreemapRect = { x: number; y: number; w: number; h: number };
type Weighted = { value: number; index: number };
export type TreemapLayout = {
  items: (TreemapRect & { index: number })[];
  groups: (TreemapRect & { group: string | undefined })[];
};

function worst(row: Weighted[], side: number): number {
  if (row.length === 0) return Infinity;
  const sum = row.reduce((value, item) => value + item.value, 0);
  const min = Math.min(...row.map((item) => item.value));
  const max = Math.max(...row.map((item) => item.value));
  return Math.max(side * side * max / (sum * sum), sum * sum / (side * side * min));
}

function squarify(values: Weighted[], box: TreemapRect, last = -1) {
  const total = values.reduce((sum, item) => sum + item.value, 0);
  const pending = values.map((item) => ({ ...item, value: item.value / total * box.w * box.h }))
    .sort((a, b) => a.index === last ? 1 : b.index === last ? -1
      : b.value - a.value || a.index - b.index);
  const result: (TreemapRect & { index: number })[] = [];
  let { x, y, w, h } = box;
  while (pending.length) {
    const side = Math.min(w, h);
    const row = [pending.shift()!];
    while (pending.length && worst([...row, pending[0]], side) <= worst(row, side)) {
      row.push(pending.shift()!);
    }
    const area = row.reduce((sum, item) => sum + item.value, 0);
    const vertical = w >= h;
    const thickness = pending.length === 0 ? (vertical ? w : h) : area / side;
    let offset = 0;
    row.forEach((item, index) => {
      const length = index === row.length - 1 ? side - offset : item.value / thickness;
      result.push({
        index: item.index,
        x: x + (vertical ? 0 : offset), y: y + (vertical ? offset : 0),
        w: vertical ? thickness : length, h: vertical ? length : thickness,
      });
      offset += length;
    });
    if (vertical) { x += thickness; w -= thickness; }
    else { y += thickness; h -= thickness; }
  }
  return result;
}

/** Group-first squarify; aspectRatio is the physical width divided by height. */
export function layoutTreemap(items: readonly TreemapItem[], aspectRatio: number): TreemapLayout {
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0 || items.length === 0 ||
    items.some((item) => !Number.isFinite(item.value) || item.value <= 0)) {
    throw new Error("Treemap requires positive finite values and aspect ratio");
  }
  // Scale before summing so finite, very large values cannot overflow the total.
  const max = Math.max(...items.map((item) => item.value));
  const keys = [...new Set(items.map((item) => item.group).filter((group) => group !== undefined))];
  const groups: (string | undefined)[] = [...keys];
  if (items.some((item) => item.group === undefined)) groups.push(undefined);
  const weights = groups.map((group, index) => ({
    index,
    value: items.reduce((sum, item) => sum + (item.group === group ? item.value / max : 0), 0),
  }));
  // The implicit group stays last, even if its aggregate value is larger.
  const implicit = groups.indexOf(undefined);
  const groupBoxes = squarify(weights, { x: 0, y: 0, w: aspectRatio, h: 1 }, implicit);
  const normalize = (box: TreemapRect): TreemapRect => ({
    x: box.x / aspectRatio * 100, y: box.y * 100,
    w: box.w / aspectRatio * 100, h: box.h * 100,
  });
  const ordered = groupBoxes.sort((a, b) =>
    a.index === implicit ? 1 : b.index === implicit ? -1 : 0);
  return {
    groups: ordered.map((box) => ({ ...normalize(box), group: groups[box.index] })),
    items: ordered.flatMap((box) => {
      const values = items.flatMap((item, index) => item.group === groups[box.index]
        ? [{ value: item.value / max, index }] : []);
      return squarify(values, box).map((rect) => ({ ...normalize(rect), index: rect.index }));
    }),
  };
}
