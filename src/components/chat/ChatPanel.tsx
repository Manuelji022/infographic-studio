"use client";

import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Icon, Text } from "@ds/ui";
import type { Messages } from "../../../messages";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageItem } from "./ChatMessageItem";
import type { BlockComment } from "../blocks/types";
import type { ChatMessage, SelectedBlock } from "./types";
import styles from "./ChatPanel.module.css";

export type ChatPanelProps = {
  messages: Messages;
  conversation: ChatMessage[];
  busy: boolean;
  /** Entry ids currently applied in the history (a reply whose entry was undone says so). */
  appliedEntryIds: ReadonlySet<string>;
  /** The latest applied entry: only its reply carries Undo. */
  undoEntryId: string | null;
  selectedBlock: SelectedBlock | null;
  /** Notes on the selected block (listed above the input). */
  comments?: BlockComment[];
  /** Picking a block moves the focus to the input (off on touch). */
  focusOnSelect?: boolean;
  /** Focus the input on mount (set when the user opened the panel). */
  autoFocus: boolean;
  /** Overlay or bottom sheet: the panel is a modal dialog and traps focus. */
  overlay: boolean;
  onClearSelection: () => void;
  onSend: (text: string) => void;
  onRetry: (messageId: string) => void;
  onUndo: (entryId: string) => void;
  /** Called with a block id when a changed-block chip is pressed. */
  onHighlightBlock: (blockId: string) => void;
  onClose: () => void;
};

const FOCUSABLE = "button:not(:disabled), textarea:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])";

export function ChatPanel(props: ChatPanelProps) {
  const { messages, conversation, busy, appliedEntryIds, undoEntryId, selectedBlock, overlay } = props;
  const logRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef(props.onClose);

  useEffect(() => {
    closeRef.current = props.onClose;
  });

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [conversation]);

  // Escape closes the overlay from anywhere on the page, unless another dialog is open on top.
  useEffect(() => {
    if (!overlay) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (document.querySelector("dialog[open]")) return;
      event.preventDefault();
      closeRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [overlay]);

  /** Keeps Tab and Shift+Tab inside the dialog while it is open as an overlay. */
  function trapTab(event: ReactKeyboardEvent) {
    const panel = panelRef.current;
    if (!overlay || event.key !== "Tab" || !panel) return;
    const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    const inside = panel.contains(active);
    if (event.shiftKey && (!inside || active === first)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (!inside || active === last)) {
      event.preventDefault();
      first.focus();
    }
  }

  const suggestions = [
    messages.chatSuggestionExecutive,
    messages.chatSuggestionShorter,
    messages.chatSuggestionMinimal,
    messages.chatSuggestionConclusions,
  ];

  return (
    <section
      ref={panelRef}
      className={styles.panel}
      role={overlay ? "dialog" : "region"}
      aria-modal={overlay ? true : undefined}
      aria-label={messages.chatTitle}
      onKeyDown={trapTab}
    >
      <header className={styles.header}>
        <Text as="h2" variant="body-strong" className={styles.title}>
          {messages.chatTitle}
        </Text>
        <button type="button" className={styles.close} aria-label={messages.workspaceClose} onClick={props.onClose}>
          <Icon name="close" />
        </button>
      </header>
      <div className={styles.scroll} ref={logRef}>
        {conversation.length === 0 ? (
          <div className={styles.empty}>
            <p>{messages.chatEmpty}</p>
            <ul className={styles.suggestions} aria-label={messages.chatSuggestionsLabel}>
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    className={styles.suggestion}
                    disabled={busy}
                    onClick={() => props.onSend(suggestion)}
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <ol className={styles.log} role="log" aria-live="polite" aria-label={messages.chatTitle}>
          {conversation.map((message) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              messages={messages}
              applied={message.role === "assistant" && message.status === "done" && appliedEntryIds.has(message.entryId)}
              canUndo={message.role === "assistant" && message.status === "done" && message.entryId === undoEntryId}
              busy={busy}
              onRetry={props.onRetry}
              onUndo={props.onUndo}
              onHighlightBlock={props.onHighlightBlock}
            />
          ))}
        </ol>
      </div>
      {selectedBlock ? (
        <section className={styles.comments} aria-label={messages.commentTitle}>
          <h3 className={styles.commentsTitle}>
            {messages.commentCount.replace("{count}", String(props.comments?.length ?? 0))}
          </h3>
          {props.comments && props.comments.length > 0 ? (
            <ul className={styles.commentList}>
              {props.comments.map((comment) => (
                <li key={comment.id} className={styles.comment}>
                  {comment.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.commentEmpty}>{messages.commentEmpty}</p>
          )}
        </section>
      ) : null}
      <ChatComposer
        focusOnSelect={props.focusOnSelect}
        messages={messages}
        busy={busy}
        selectedBlock={selectedBlock}
        autoFocus={props.autoFocus || overlay}
        onClearSelection={props.onClearSelection}
        onSend={props.onSend}
      />
    </section>
  );
}
