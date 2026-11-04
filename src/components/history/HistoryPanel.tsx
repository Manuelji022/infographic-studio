"use client";

import { Button, Dialog, Text } from "@ds/ui";
import type { getMessages, Locale } from "../../../messages";
import type { HistoryView } from "../../mocks/types";
import styles from "./HistoryPanel.module.css";

export type HistoryPanelProps = {
  open: boolean;
  onClose: () => void;
  messages: ReturnType<typeof getMessages>;
  locale: Locale;
  history: HistoryView;
  /** A restore is in flight: every restore button is disabled. */
  busy: boolean;
  /** Text announced politely after a restore (empty until one happens). */
  notice: string;
  /** `null` restores the original version. */
  onRestore: (entryId: string | null) => void;
};

const DATE_LOCALE: Record<Locale, string> = { es: "es-ES", en: "en-GB" };

/**
 * Change history of one infographic (UI_EXPERIENCE §4.12): newest first, the current state
 * marked, a Restore button on every other row and the original version at the bottom.
 */
export function HistoryPanel({ open, onClose, messages, locale, history, busy, notice, onRestore }: HistoryPanelProps) {
  const { entries, cursor } = history;
  const formatter = new Intl.DateTimeFormat(DATE_LOCALE[locale], { dateStyle: "medium", timeStyle: "short" });
  const newestFirst = entries.map((entry, index) => ({ entry, position: index + 1 })).reverse();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={messages.historyTitle}
      footer={
        <Button variant="ivory" onClick={onClose}>
          {messages.workspaceClose}
        </Button>
      }
    >
      <span role="status" aria-live="polite" className={styles.srOnly}>
        {notice}
      </span>
      {entries.length === 0 ? (
        <Text variant="body" tone="muted">{messages.historyEmpty}</Text>
      ) : (
        <ol className={styles.list} aria-label={messages.historyTitle}>
          {newestFirst.map(({ entry, position }) => {
            const current = position === cursor;
            return (
              <li key={entry.id} className={styles.row} aria-current={current ? "true" : undefined}>
                <div className={styles.meta}>
                  <span className={styles.scope}>
                    {entry.scope === "global" ? messages.historyScopeGlobal : messages.historyScopeBlock}
                  </span>
                  <time dateTime={entry.createdAt}>{formatter.format(new Date(entry.createdAt))}</time>
                  {current ? <span className={styles.current}>{messages.historyCurrent}</span> : null}
                </div>
                <Text variant="body-sm" className={styles.instruction}>{entry.instruction}</Text>
                {entry.blockNames.length > 0 ? (
                  <Text variant="caption" tone="muted">
                    {messages.historyAffected} {entry.blockNames.join(", ")}
                  </Text>
                ) : null}
                {current ? null : (
                  <div className={styles.actions}>
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => onRestore(entry.id)}>
                      {messages.historyRestore}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
          <li className={styles.row} aria-current={cursor === 0 ? "true" : undefined}>
            <div className={styles.meta}>
              <span className={styles.scope}>{messages.historyOriginal}</span>
              {cursor === 0 ? <span className={styles.current}>{messages.historyCurrent}</span> : null}
            </div>
            {cursor === 0 ? null : (
              <div className={styles.actions}>
                <Button variant="outline" size="sm" disabled={busy} onClick={() => onRestore(null)}>
                  {messages.historyRestore}
                </Button>
              </div>
            )}
          </li>
        </ol>
      )}
    </Dialog>
  );
}
