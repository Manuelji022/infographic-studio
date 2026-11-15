import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { AppHeaderShell } from "../components/app-header";
import { getAuth } from "../lib/auth";
import { LOCALE_COOKIE, THEME_COOKIE, parseLocale, parseTheme } from "../lib/locale";
import { STYLE_COOKIE, parseStyle } from "../lib/style";
import "./globals.css";

export const instant = false;

export const metadata: Metadata = {
  title: "Infographic Studio",
  description: "Turn any text into a clear, shareable infographic.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  let locale = parseLocale(undefined);
  let style = parseStyle(undefined);
  try {
    const cookieStore = await cookies();
    locale = parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);
    style = parseStyle(cookieStore.get(STYLE_COOKIE)?.value);
  } catch {
    // Fall back to the default locale if request cookies cannot be read.
  }

  let theme = parseTheme(undefined);
  try {
    theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  } catch {
    // Follow the system theme if request cookies cannot be read.
  }

  let user: { name: string; email: string } | null = null;
  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    user = session ? { name: session.user.name, email: session.user.email } : null;
  } catch {
    user = null;
  }

  return (
    <html lang={locale} data-ds-style={style} data-ds-theme={theme}>
      <head>
        <link
          rel="preload"
          href="/fonts/source-serif-4-latin-opsz-wght.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/geist-latin-wght.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <AppHeaderShell locale={locale} style={style} theme={theme} user={user} />
        {children}
      </body>
    </html>
  );
}
