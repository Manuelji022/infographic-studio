export type UnitFormat = {
  kind: "number" | "percent" | "currency";
  currency?: "EUR" | "USD";
  decimals?: 0 | 1 | 2;
  suffix?: string;
};

function format(
  value: number,
  locale: "es" | "en",
  unit: UnitFormat | undefined,
  tick: boolean,
): string {
  const kind = unit?.kind ?? "number";
  const decimals = unit?.decimals;
  // Intl es-ES leaves four-digit integers ungrouped: 1500, but 15.000.
  const formatter = new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
    style: kind === "number" ? "decimal" : kind,
    ...(kind === "currency" ? { currency: unit?.currency ?? "EUR" } : {}),
    minimumFractionDigits: tick ? 0 : (decimals ?? 0),
    maximumFractionDigits: decimals ?? 1,
  });
  const number = formatter.format(kind === "percent" ? value / 100 : value);
  const separator = locale === "es" ? "\u202f" : " ";
  return unit?.suffix ? `${number}${separator}${unit.suffix}` : number;
}

export function formatValue(
  value: number,
  locale: "es" | "en",
  unit?: UnitFormat,
): string {
  return format(value, locale, unit, false);
}

export function formatTick(
  value: number,
  locale: "es" | "en",
  unit?: UnitFormat,
): string {
  return format(value, locale, unit, true);
}
