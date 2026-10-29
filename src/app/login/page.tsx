import { cookies } from "next/headers";
import { getMessages } from "../../../messages";
import { LoginButton } from "../../components/login-button";
import { LOCALE_COOKIE, parseLocale } from "../../lib/locale";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [{ error }, cookieStore] = await Promise.all([searchParams, cookies()]);
  const messages = getMessages(parseLocale(cookieStore.get(LOCALE_COOKIE)?.value));

  return (
    <main>
      <h1>{messages.appName}</h1>
      {error ? <p role="alert">{messages.loginError}</p> : null}
      <LoginButton label={messages.loginButton} />
    </main>
  );
}
