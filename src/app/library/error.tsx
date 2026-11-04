"use client";

import { useEffect, useSyncExternalStore } from "react";
import { ErrorState } from "@ds/ui";
import { getMessages, type Locale } from "../../../messages";
import { LOCALE_COOKIE, parseLocale } from "../../lib/locale";
import styles from "./page.module.css";

function readLocale(): Locale {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
    return parseLocale(match?.[1]);
  } catch {
    return parseLocale(undefined);
  }
}

export default function LibraryError({ error, retry }: { error: unknown; retry: () => void }) {
  const locale = useSyncExternalStore(
    () => () => {},
    readLocale,
    () => parseLocale(undefined),
  );
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
      <ErrorState
        title={messages.libraryLoadError}
        description={messages.errorBody}
        retryLabel={messages.retry}
        onRetry={retry}
        detail={digest}
        detailLabel={messages.errorReferenceSummary}
        autoFocusRetry
      />
    </main>
  );
}
