import { en } from "./en";
import { es } from "./es";

export type Messages = { [Key in keyof typeof es]: string };
export type Locale = "es" | "en";

export const defaultLocale: Locale = "es";

export function getMessages(locale: Locale): Messages {
  return locale === "es" ? es : en;
}
