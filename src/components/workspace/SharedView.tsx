"use client";

import { usePathname, useRouter } from "next/navigation";
import { LanguageToggle, Text } from "@ds/ui";
import { getMessages, type Locale } from "../../../messages";
import { InfographicFrame } from "./InfographicFrame";
import styles from "./SharedView.module.css";

/** Public view (UI_EXPERIENCE §4.5): minimal bar, the document, and the source footer. */
export function SharedView({
  locale,
  title,
  srcDoc,
  locales,
  sourceUrl,
}: {
  locale: Locale;
  title: string;
  srcDoc: string;
  /** Locales the infographic exists in; the toggle shows only when there are two. */
  locales: Locale[];
  sourceUrl: string | null;
}) {
  const messages = getMessages(locale);
  const router = useRouter();
  const pathname = usePathname();
  const safeUrl = sourceUrl && /^https?:\/\//i.test(sourceUrl) ? sourceUrl : null;

  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <Text as="h1" variant="ui-strong" className={styles.title}>{title}</Text>
        {locales.length > 1 ? (
          <LanguageToggle
            label={messages.sharedLanguageToggle}
            value={locale}
            options={[
              { value: "es", label: "ES", ariaLabel: messages.languageSpanish },
              { value: "en", label: "EN", ariaLabel: messages.languageEnglish },
            ]}
            onChange={(value) => router.replace(`${pathname}?lang=${value}`, { scroll: false })}
          />
        ) : null}
      </header>
      <main className={styles.main}>
        <InfographicFrame srcDoc={srcDoc} title={title} loading={messages.workspaceLoading} />
      </main>
      {sourceUrl ? (
        <footer className={styles.footer}>
          <Text variant="caption" tone="muted">
            {messages.sharedFooterSource}:{" "}
            {safeUrl ? (
              <a href={safeUrl} target="_blank" rel="noopener noreferrer nofollow" className={styles.source}>
                {safeUrl}
              </a>
            ) : (
              sourceUrl
            )}
          </Text>
        </footer>
      ) : null}
    </div>
  );
}
