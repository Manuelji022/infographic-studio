"use client";

import { ErrorScreen, useClientLocale } from "../components/error-screen";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  const locale = useClientLocale();
  return <ErrorScreen error={error} retry={retry} locale={locale} />;
}
