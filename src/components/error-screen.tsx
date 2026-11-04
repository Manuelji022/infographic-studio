"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Card, ErrorMessage, Text } from "@ds/ui";
import { getMessages, type Locale } from "../../messages";
import { LOCALE_COOKIE, parseLocale } from "../lib/locale";
import styles from "./centered-page.module.css";

function readLocaleCookie(): Locale {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
    return parseLocale(match?.[1]);
  } catch {
    return parseLocale(undefined);
  }
}

const subscribe = () => () => {};

/** Locale from the cookie on the client, falling back to the default during SSR. Shared by the error pages. */
export function useClientLocale(): Locale {
  return useSyncExternalStore(subscribe, readLocaleCookie, () => parseLocale(undefined));
}

/** Shared body of error.tsx and global-error.tsx (UI_EXPERIENCE §4.10). Never shows a stack trace. */
export function ErrorScreen({
  error,
  retry,
  locale,
}: {
  error: unknown;
  retry: () => void;
  locale: Locale;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const messages = getMessages(locale);
  const digest =
    error instanceof Error && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : undefined;

  return (
    <main className={styles.main}>
      <Card className={styles.card}>
        <Text as="h1" variant="subheading-serif" className={styles.title}>
          {messages.errorTitle}
        </Text>
        <ErrorMessage
          className={styles.errorBox}
          live="assertive"
          description={messages.errorBody}
          action={{ label: messages.errorReset, onClick: retry }}
          link={{ label: messages.notFoundGenerate, href: "/" }}
          reference={digest ? { summary: messages.errorReferenceSummary, id: digest } : undefined}
          focusAction
        >
          {messages.genericError}
        </ErrorMessage>
      </Card>
    </main>
  );
}
