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
