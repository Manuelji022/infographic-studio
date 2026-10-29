import { getMessages, type Locale } from "../../messages";
import { LanguageToggle } from "./language-toggle";

export function Header({ locale }: { locale: Locale }) {
  const messages = getMessages(locale);
  return (
    <header>
      <span>{messages.appName}</span>
      <LanguageToggle locale={locale} />
    </header>
  );
}
