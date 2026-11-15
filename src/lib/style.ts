export const STYLE_COOKIE = "ds-style";

export type DesignStyle = "studio" | "paper";

export const defaultStyle: DesignStyle = "studio";

export function parseStyle(value: unknown): DesignStyle {
  try {
    return value === "studio" || value === "paper" ? value : defaultStyle;
  } catch {
    return defaultStyle;
  }
}

export function writeStyleCookie(style: DesignStyle): void {
  try {
    document.cookie = `${STYLE_COOKIE}=${style}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // Cookie persistence is best-effort; the UI remains usable.
  }
}
