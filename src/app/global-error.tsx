"use client";

import "./globals.css";
import { ErrorScreen, useClientLocale } from "../components/error-screen";

// Replaces the root layout when it fails, so it brings its own document and global styles.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const locale = useClientLocale();
  return (
    <html lang={locale} data-ds-theme="auto">
      <body>
        <ErrorScreen error={error} retry={retry} locale={locale} />
      </body>
    </html>
  );
}
