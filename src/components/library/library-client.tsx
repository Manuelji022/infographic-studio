"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { ShareLink } from "../../mocks/types";
import { ShareController } from "../share/ShareController";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  InfographicCard,
  Note,
  SearchBar,
  Select,
  Switch,
  Text,
} from "@ds/ui";
import buttonStyles from "@ds/ui/primitives/Button/Button.module.css";
import { getMessages, type Locale } from "../../../messages";
import type { LibraryQuery } from "../../app/library/query";
import { deleteInfographic } from "../../mocks/actions";
import { CardMenu } from "./card-menu";
import { Thumbnail } from "./thumbnail";
import type { LibraryCardData } from "./types";
import styles from "./library-client.module.css";

type Props = {
  locale: Locale;
  query: LibraryQuery;
  cards: LibraryCardData[];
  libraryEmpty: boolean;
  tagOptions: string[];
};

export function LibraryClient({ locale, query, cards, libraryEmpty, tagOptions }: Props) {
  const messages = getMessages(locale);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(query.q);
  const [lastQuery, setLastQuery] = useState(query.q);
  // True from the first keystroke until the debounced navigation is sent.
  const [editing, setEditing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(
    Boolean(query.tag || query.lang || query.shared || query.from || query.to),
  );
  const [deleting, setDeleting] = useState<LibraryCardData | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  // A delete redirect from the infographic view (?deleted=1) starts with the success notice.
  const [notice, setNotice] = useState<{ text: string; tone: "success" | "error" } | null>(() =>
    query.deleted ? { text: messages.deleteDone, tone: "success" } : null,
  );
  const [shareCard, setShareCard] = useState<LibraryCardData | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  // Share links changed in this session, by infographic id (the server copy refreshes later).
  const [shareLinks, setShareLinks] = useState<Record<string, ShareLink | null>>({});

  // The URL drives the input only when the user is not typing and no navigation is in
  // flight. Otherwise a late response for an older query would overwrite newer input.
  if (query.q !== lastQuery && !editing && !isPending) {
    setLastQuery(query.q);
    setSearch(query.q);
  }

  // Latest query string the user asked for. Navigations build from this, not from the
  // searchParams of a possibly stale render, so a slow response cannot restore old filters.
  const intendedRef = useRef(searchParams.toString());
  useEffect(() => {
    if (!isPending) intendedRef.current = searchParams.toString();
  }, [searchParams, isPending]);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFocusRef = useRef<string | null>(null);
  useEffect(() => () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
  }, []);

  const replaceUrl = (qs: string) => {
    intendedRef.current = qs;
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const navigate = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(intendedRef.current);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    replaceUrl(next.toString());
  };

  const cancelSearchTimer = () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = null;
  };

  const onSearchChange = (value: string) => {
    setEditing(true);
    setSearch(value);
    cancelSearchTimer();
    searchTimerRef.current = setTimeout(() => {
      searchTimerRef.current = null;
      setEditing(false);
      const trimmed = value.trim();
      const current = new URLSearchParams(intendedRef.current).get("q") ?? "";
      if (trimmed !== current) navigate({ q: trimmed || null, sort: null });
    }, 300);
  };

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Strip ?deleted=1 once the notice is shown, keeping every other parameter.
  useEffect(() => {
    if (!query.deleted) return;
    const next = new URLSearchParams(intendedRef.current);
    next.delete("deleted");
    replaceUrl(next.toString());
    // Runs once per redirect; replaceUrl only reads refs and the stable router.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.deleted]);

  // Focus a menu trigger after the native dialog has restored focus to the unmounted item.
  const focusTrigger = (id: string) => {
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-menu-trigger="${CSS.escape(id)}"]`)?.focus();
    });
  };

  // After a successful delete, focus the neighbouring card once the refreshed list arrives.
  useEffect(() => {
    const target = pendingFocusRef.current;
    if (target === null) return;
    pendingFocusRef.current = null;
    const link = target
      ? document.querySelector<HTMLElement>(`a[href="/i/${CSS.escape(target)}"]`)
      : null;
    (link ?? document.querySelector<HTMLElement>("form[data-library-search] input"))?.focus();
  }, [cards]);

  const hasFilters = Boolean(query.q || query.tag || query.lang || query.shared || query.from || query.to);
  const activeExtra = [query.tag, query.lang, query.shared ? "1" : "", query.from, query.to]
    .filter(Boolean).length;

  // Cancels any pending debounced search first, so it cannot re-add the cleared query.
  const clearAll = () => {
    cancelSearchTimer();
    setEditing(false);
    setSearch("");
    const next = new URLSearchParams();
    if (query.mock) next.set("mock", query.mock);
    replaceUrl(next.toString());
  };

  const cancelDelete = () => {
    if (deletePending || !deleting) return;
    setDeleting(null);
    focusTrigger(deleting.id);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const card = deleting;
    const index = cards.findIndex((c) => c.id === card.id);
    const neighbour = cards[index + 1] ?? cards[index - 1];
    setDeletePending(true);
    try {
      const result = await deleteInfographic(card.id);
      if (!result.ok) throw new Error(result.error.message);
      pendingFocusRef.current = neighbour?.id ?? "";
      setDeleting(null);
      setNotice({ text: messages.deleteDone, tone: "success" });
      router.refresh();
    } catch {
      setDeleting(null);
      setNotice({ text: messages.genericError, tone: "error" });
      focusTrigger(card.id);
    } finally {
      setDeletePending(false);
    }
  };

  const openShare = (card: LibraryCardData) => {
    setShareCard(card);
    setShareOpen(true);
  };

  const closeShare = () => {
    if (!shareCard) return;
    const id = shareCard.id;
    setShareOpen(false);
    focusTrigger(id);
  };

  const shareLinkFor = (card: LibraryCardData): ShareLink | null =>
    card.id in shareLinks ? shareLinks[card.id] : card.shareLink;

  // Keep the active tag selectable even if the list (built per locale) does not contain it.
  const tagChoices = query.tag && !tagOptions.includes(query.tag)
    ? [query.tag, ...tagOptions]
    : tagOptions;

  const linkButton = (variant: "accent" | "outline") =>
    `${buttonStyles.button} ${buttonStyles.md} ${buttonStyles[variant]}`;

  return (
    <>
      <div className={styles.toolbar}>
        <SearchBar
          value={search}
          onChange={onSearchChange}
          onSubmit={(value) => {
            cancelSearchTimer();
            setEditing(false);
            navigate({ q: value.trim() || null, sort: null });
          }}
          label={messages.librarySearchLabel}
          placeholder={messages.librarySearchPlaceholder}
          clearLabel={messages.libraryFilterClear}
          submitLabel={messages.librarySearchLabel}
          className={styles.search}
          data-library-search
        />
        <div className={styles.filterRow}>
          <Button
            variant="outline"
            size="sm"
            aria-expanded={filtersOpen}
            aria-controls="library-filters"
            onClick={() => setFiltersOpen((value) => !value)}
          >
            {messages.libraryFilters}
            {activeExtra ? ` (${activeExtra})` : ""}
          </Button>
          {query.q ? (
            <div className={styles.sort}>
              <Field label={messages.librarySort}>
                <Select
                  value={query.sort}
                  onChange={(event) => navigate({ sort: event.currentTarget.value })}
                >
                  <option value="relevance">{messages.librarySortRelevance}</option>
                  <option value="date">{messages.librarySortDate}</option>
                </Select>
              </Field>
            </div>
          ) : null}
          <Text as="p" variant="ui-sm" tone="muted" className={styles.count} role="status">
            {messages.libraryResults.replace("{count}", String(cards.length))}
          </Text>
        </div>
        {filtersOpen ? (
          <div id="library-filters" role="group" aria-label={messages.libraryFilters} className={styles.filters}>
            <Field label={messages.libraryFilterTag}>
              <Select
                value={query.tag}
                onChange={(event) => navigate({ tag: event.currentTarget.value || null })}
              >
                <option value="">{messages.libraryFilterAll}</option>
                {tagChoices.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </Select>
            </Field>
            <Field label={messages.libraryFilterLanguage}>
              <Select
                value={query.lang}
                onChange={(event) => navigate({ lang: event.currentTarget.value || null })}
              >
                <option value="">{messages.libraryFilterAll}</option>
                <option value="es">ES</option>
                <option value="en">EN</option>
              </Select>
            </Field>
            <Field label={messages.libraryFilterFrom}>
              <Input
                type="date"
                value={query.from}
                max={query.to || undefined}
                onChange={(event) => navigate({ from: event.currentTarget.value || null })}
              />
            </Field>
            <Field label={messages.libraryFilterTo}>
              <Input
                type="date"
                value={query.to}
                min={query.from || undefined}
                onChange={(event) => navigate({ to: event.currentTarget.value || null })}
              />
            </Field>
            <div className={styles.switchSlot}>
              <Switch
                checked={query.shared}
                onChange={(event) => navigate({ shared: event.currentTarget.checked ? "1" : null })}
              >
                {messages.libraryFilterShared}
              </Switch>
              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  {messages.libraryFilterClear}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div role="status" className={styles.notice}>
        {notice ? (
          <Note variant={notice.tone === "success" ? "success" : "error"}>{notice.text}</Note>
        ) : null}
      </div>

      {libraryEmpty ? (
        <EmptyState
          icon="search"
          title={messages.libraryEmptyTitle}
          description={messages.libraryEmptyBody}
          action={<Link href="/" className={linkButton("accent")}>{messages.libraryNew}</Link>}
        />
      ) : cards.length === 0 ? (
        <EmptyState
          icon="search"
          title={messages.libraryNoResultsTitle}
          description={messages.libraryNoResultsBody}
          action={<Button variant="outline" onClick={clearAll}>{messages.libraryFilterClear}</Button>}
        />
      ) : (
        <ul className={styles.grid} aria-busy={isPending} data-pending={isPending || undefined}>
          {cards.map((card) => (
            <li key={card.id} className={styles.cell}>
              <InfographicCard
                title={card.title}
                href={`/i/${card.id}`}
                summary={card.summary}
                tags={card.tags}
                date={card.dateLabel}
                languages={card.languages}
                sharedLabel={card.shared ? messages.cardShared : undefined}
                moreTagsLabel={messages.cardMoreTags}
                thumbnail={<Thumbnail src={card.previewSrc} />}
              />
              <CardMenu
                id={card.id}
                title={card.title}
                messages={messages}
                onShare={() => openShare(card)}
                onDelete={() => setDeleting(card)}
              />
            </li>
          ))}
        </ul>
      )}

      {shareCard ? (
        <ShareController
          key={shareCard.id}
          infographicId={shareCard.id}
          link={shareLinkFor(shareCard)}
          locale={locale}
          open={shareOpen}
          onClose={closeShare}
          onChange={(link) => {
            setShareLinks((previous) => ({ ...previous, [shareCard.id]: link }));
            router.refresh();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title={messages.deleteTitle}
        description={messages.deleteBody}
        confirmLabel={messages.deleteConfirm}
        cancelLabel={messages.deleteCancel}
        status={deletePending ? "pending" : "idle"}
      />
    </>
  );
}
