import { defaultLocale, type Locale } from "../../messages";

export const LOCALE_COOKIE = "locale";

export function parseLocale(value: unknown): Locale {
  try {
    return value === "es" || value === "en" ? value : defaultLocale;
  } catch {
    return defaultLocale;
  }
}

export function writeLocaleCookie(locale: Locale): void {
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // Cookie persistence is best-effort; the UI remains usable.
  }
}

export const THEME_COOKIE = "ds-theme";
export type ThemeChoice = "light" | "dark";

export function parseTheme(value: unknown): ThemeChoice | "auto" {
  return value === "light" || value === "dark" ? value : "auto";
}

export function writeThemeCookie(theme: ThemeChoice): void {
  try {
    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // Persistence is best-effort; the theme still applies for this page.
  }
}
