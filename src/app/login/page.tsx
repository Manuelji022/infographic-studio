import { cookies } from "next/headers";
import { getMessages } from "../../../messages";
import { LoginButton } from "../../components/login-button";
import { Callout } from "@ds/ui";
import styles from "./login.module.css";
import { LOCALE_COOKIE, parseLocale } from "../../lib/locale";

// Reads searchParams and the locale cookie, so this route blocks (same choice as the root layout).
export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [{ error }, cookieStore] = await Promise.all([searchParams, cookies()]);
  const messages = getMessages(parseLocale(cookieStore.get(LOCALE_COOKIE)?.value));

  return (
    <main className={styles.main}>
      <h1 className={`ds-type-heading ${styles.title}`}>{messages.appName}</h1>
      {error ? <Callout as="div" role="alert">{messages.loginError}</Callout> : null}
      <LoginButton label={messages.loginButton} pendingLabel={messages.loginPending} />
    </main>
  );
}
