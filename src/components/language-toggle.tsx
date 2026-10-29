"use client";

import { useRouter } from "next/navigation";
import { getMessages, type Locale } from "../../messages";
import { writeLocaleCookie } from "../lib/locale";

export function LanguageToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const nextLocale: Locale = locale === "es" ? "en" : "es";
  const messages = getMessages(locale);
  const otherLanguage = nextLocale === "en" ? "English" : "Español";

  function toggleLanguage() {
    writeLocaleCookie(nextLocale);
    router.refresh();
  }

  return (
    <button type="button" onClick={toggleLanguage} aria-label={messages.languageToggle}>
      {locale.toUpperCase()} / {otherLanguage}
    </button>
  );
}
