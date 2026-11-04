import { cookies } from "next/headers";
import { GenerateScreen } from "../components/generate/GenerateScreen";
import { LOCALE_COOKIE, parseLocale } from "../lib/locale";
import type { MockFlag } from "../mocks/actions";

// Reads searchParams and the locale cookie, so this route blocks (same choice as the root layout).
export const instant = false;

export default async function Home({ searchParams }: PageProps<"/">) {
  const [{ mock }, cookieStore] = await Promise.all([searchParams, cookies()]);
  const flag = mock === "error" || mock === "slow" ? (mock satisfies MockFlag) : undefined;
  return (
    <GenerateScreen locale={parseLocale(cookieStore.get(LOCALE_COOKIE)?.value)} mock={flag} />
  );
}
