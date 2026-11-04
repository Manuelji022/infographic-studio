"use client";

import { useRouter } from "next/navigation";
import { LanguageToggle } from "@ds/ui";
import type { Locale, Messages } from "../../../messages";
import { writeLocaleCookie } from "../../lib/locale";

export function LoginLanguageToggle({ locale, messages }: { locale: Locale; messages: Messages }) {
  const router = useRouter();
  return (
    <LanguageToggle
      label={messages.languageToggle}
      value={locale}
      options={[
        { value: "es", label: "ES", ariaLabel: messages.languageSpanish },
        { value: "en", label: "EN", ariaLabel: messages.languageEnglish },
      ]}
      onChange={(value) => {
        writeLocaleCookie(value as Locale);
        router.refresh();
      }}
    />
  );
}
