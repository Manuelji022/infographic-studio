import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, ErrorMessage, Text } from "@ds/ui";
import { getMessages } from "../../../messages";
import { LoginButton } from "../../components/login-button";
import { isDeniedOAuthError, normalizeErrorParam } from "../../components/login-errors";
import { getAuth } from "../../lib/auth";
import { LOCALE_COOKIE, parseLocale } from "../../lib/locale";
import centered from "../../components/centered-page.module.css";
import { LoginLanguageToggle } from "./login-footer";

// Reads searchParams and the locale cookie, so this route blocks (same choice as the root layout).
export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [params, cookieStore] = await Promise.all([searchParams, cookies()]);
  const error = normalizeErrorParam(params.error);
  const locale = parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const messages = getMessages(locale);

  let authenticated = false;
  try {
    authenticated = Boolean(await getAuth().api.getSession({ headers: await headers() }));
  } catch {
    authenticated = false;
  }
  if (authenticated) redirect("/");

  const denied = isDeniedOAuthError(error);

  return (
    <main className={centered.main}>
      <Card as="section" className={centered.card} aria-labelledby="login-title">
        <Text as="h1" id="login-title" variant="display" className={centered.title}>
          {messages.loginTitle}
        </Text>
        <Text tone="muted" className={centered.body}>{messages.loginDescription}</Text>
        {error ? (
          <ErrorMessage live="assertive" className={centered.errorBox}>
            {denied ? messages.loginDenied : messages.loginError}
          </ErrorMessage>
        ) : null}
        <LoginButton
          label={messages.loginButton}
          retryLabel={messages.retry}
          pendingLabel={messages.loginPending}
          errorLabel={messages.loginError}
          retry={Boolean(error) && !denied}
        />
      </Card>
      <div className={centered.footer}>
        <LoginLanguageToggle locale={locale} messages={messages} />
      </div>
    </main>
  );
}
