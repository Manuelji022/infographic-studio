"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getMessages, type Locale } from "../../messages";
import { useState } from "react";
import { AppHeader, LanguageToggle, ThemeToggle, UserMenu } from "@ds/ui";
import { authClient } from "../lib/auth-client";
import { writeLocaleCookie, writeThemeCookie, type ThemeChoice } from "../lib/locale";

export function AppHeaderShell({
  locale,
  theme: initialTheme,
  user,
}: {
  locale: Locale;
  theme: ThemeChoice | "auto";
  user: { name: string; email: string } | null;
}) {
  const messages = getMessages(locale);
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState(initialTheme);
  // Login and shared-link screens have their own minimal chrome (UI_EXPERIENCE §4.1, §4.9).
  // The workspace (/i/*) brings its own thin bar (UI_EXPERIENCE §4.3).
  const bare =
    pathname === "/login" || pathname.startsWith("/login/") ||
    pathname === "/s" || pathname.startsWith("/s/") ||
    pathname === "/i" || pathname.startsWith("/i/");
  const items = user
    ? [
        { key: "generate", label: messages.navGenerate, href: "/" },
        { key: "library", label: messages.navLibrary, href: "/library" },
        { key: "design-system", label: messages.navDesignSystem, href: "/design-system" },
        { key: "components", label: messages.navComponents, href: "/components" },
        { key: "charts", label: messages.navCharts, href: "/charts" },
      ].map((item) => ({
        ...item,
        current:
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(`${item.href}/`)),
      }))
    : [];

  if (bare) return null;

  return (
    <AppHeader
      brand={<Link href="/">{messages.appName}</Link>}
      navLabel={messages.navLabel}
      items={items}
      actions={
        <>
          <ThemeToggle
            label={messages.themeToggle}
            lightLabel={messages.themeLight}
            darkLabel={messages.themeDark}
            value={theme}
            onChange={(value) => {
              setTheme(value);
              writeThemeCookie(value);
              document.documentElement.dataset.dsTheme = value;
            }}
          />
          <LanguageToggle
            label={messages.languageToggle}
            value={locale}
            options={[
              { value: "es", label: "ES", ariaLabel: messages.languageSpanish },
              { value: "en", label: "EN", ariaLabel: messages.languageEnglish },
            ]}
            onChange={(value) => {
              writeLocaleCookie(value as Locale);
              router.refresh();
            }}
          />
          {user ? (
            <UserMenu
              name={user.name}
              email={user.email}
              triggerLabel={messages.userMenu}
              items={[
                {
                  key: "sign-out",
                  label: messages.signOut,
                  onSelect: () =>
                    authClient.signOut({
                      fetchOptions: { onSuccess: () => router.push("/login") },
                    }),
                },
              ]}
            />
          ) : null}
        </>
      }
    />
  );
}
