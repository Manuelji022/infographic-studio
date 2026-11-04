import { io } from "next/cache";
import { cookies } from "next/headers";
import Link from "next/link";
import buttonStyles from "@ds/ui/primitives/Button/Button.module.css";
import { getMessages, type Locale } from "../../../messages";
import { LibraryClient } from "../../components/library/library-client";
import type { LibraryCardData } from "../../components/library/types";
import { LOCALE_COOKIE, parseLocale } from "../../lib/locale";
import { isLinkActive, listInfographics } from "../../mocks/store";
import type { MockInfographic } from "../../mocks/types";
import styles from "./page.module.css";
import { displayContent, filterInfographics, parseQuery, tagOptions } from "./query";

function toCard(item: MockInfographic, locale: Locale, dateFormat: Intl.DateTimeFormat): LibraryCardData {
  const content = displayContent(item, locale)!;
  const active = isLinkActive(item.share) ? item.share : null;
  return {
    id: item.id,
    title: content.title,
    summary: content.summary,
    tags: content.tags,
    dateLabel: dateFormat.format(new Date(item.createdAt)),
    languages: (Object.keys(item.contents) as Locale[]).map((code) => ({
      code,
      label: code.toUpperCase(),
    })),
    shared: active !== null,
    shareLink: active,
    previewSrc: `/library/preview/${item.id}?locale=${content.locale}`,
  };
}

export default async function LibraryPage({ searchParams }: PageProps<"/library">) {
  const query = parseQuery(await searchParams);
  if (query.mock === "error") throw new Error("Mock: library load failure");
  // Dev-only switch that holds the page so the loading skeleton can be captured.
  if (query.mock === "slow" && process.env.NODE_ENV !== "production") {
    await new Promise((resolve) => setTimeout(resolve, 8000));
  }

  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const messages = getMessages(locale);
  // The store and isLinkActive read the clock; keep them out of the static shell.
  await io();
  const all = query.mock === "empty" ? [] : listInfographics();
  const matches = filterInfographics(
    query.shared ? all.filter((item) => isLinkActive(item.share)) : all,
    query,
  );
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const cards = matches.map((item) => toCard(item, locale, dateFormat));

  return (
    <main className={styles.main}>
      <div className={styles.titleRow}>
        <h1 className={`ds-type-heading ${styles.title}`}>{messages.libraryTitle}</h1>
        <Link
          href="/"
          className={`${buttonStyles.button} ${buttonStyles.md} ${buttonStyles.accent}`}
        >
          {messages.libraryNew}
        </Link>
      </div>
      <LibraryClient
        locale={locale}
        query={query}
        cards={cards}
        libraryEmpty={all.length === 0}
        tagOptions={tagOptions(all, locale)}
      />
    </main>
  );
}
