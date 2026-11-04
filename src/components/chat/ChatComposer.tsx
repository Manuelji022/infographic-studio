"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Icon, Textarea } from "@ds/ui";
import type { Messages } from "../../../messages";
import { ContextChip } from "./ContextChip";
import type { SelectedBlock } from "./types";
import styles from "./ChatPanel.module.css";

export function ChatComposer({
  messages,
  busy,
  selectedBlock,
  autoFocus,
  focusOnSelect = true,
  onClearSelection,
  onSend,
}: {
  messages: Messages;
  busy: boolean;
  selectedBlock: SelectedBlock | null;
  autoFocus: boolean;
  /** Picking a block moves the focus here (off on touch, where it would raise the keyboard). */
  focusOnSelect?: boolean;
  onClearSelection: () => void;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const selectedId = selectedBlock?.id ?? null;

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Picking a block moves the focus to the input, with the context chip above it (UI_EXPERIENCE §4.3).
  useEffect(() => {
    if (selectedId && focusOnSelect) inputRef.current?.focus();
  }, [selectedId, focusOnSelect]);

  const canSend = text.trim().length > 0 && !busy;

  function submit() {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <form
      className={styles.composer}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {selectedBlock ? (
        <ContextChip block={selectedBlock} messages={messages} onClear={onClearSelection} />
      ) : null}
      <div className={styles.inputRow}>
        <Textarea
          ref={inputRef}
          rows={2}
          resize="none"
          value={text}
          aria-label={messages.chatInputLabel}
          placeholder={messages.chatInputPlaceholder}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <Button type="submit" variant="accent" disabled={!canSend} aria-label={messages.chatSend} className={styles.send}>
          <Icon name="arrow-right" />
        </Button>
      </div>
    </form>
  );
}
