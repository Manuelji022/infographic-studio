"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button, Textarea } from "@ds/ui";
import type { Messages } from "../../../messages";
import type { Rect } from "./types";
import styles from "./CommentPopover.module.css";

const WIDTH = 320;
/** Distance from the block's top edge to the popover when it opens below the block. */
const BELOW = 44;
const EDGE = 8;

/**
 * Small non-modal popover anchored to a block: one text field and the choice between saving a
 * note and asking the AI for a change (the same instruction, anchored to a block: UI_EXPERIENCE §2).
 * It opens below the block and flips above it when it would not fit, so it stays inside the
 * overlay layer (which clips at the frame edge) even for blocks at the bottom, such as the footer.
 * On touch layouts it is a sheet at the bottom of the screen so the keyboard never covers it.
 */
export function CommentPopover({
  messages,
  anchor,
  frameWidth,
  frameHeight,
  touchMode,
  blockName,
  busy,
  onCancel,
  onSave,
  onAskAi,
}: {
  messages: Messages;
  anchor: Rect;
  frameWidth: number;
  frameHeight: number;
  touchMode: boolean;
  blockName: string;
  busy: boolean;
  onCancel: () => void;
  onSave: (text: string) => Promise<boolean>;
  onAskAi: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const empty = text.trim().length === 0;
  const [top, setTop] = useState(anchor.y + BELOW);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Measured before paint: below the anchor when it fits, otherwise above it, otherwise pinned to the frame.
  useLayoutEffect(() => {
    const height = formRef.current?.offsetHeight ?? 0;
    const below = anchor.y + BELOW;
    if (touchMode || below + height <= frameHeight - EDGE) {
      setTop(below);
      return;
    }
    const above = anchor.y - height - EDGE;
    setTop(above >= EDGE ? above : Math.max(EDGE, frameHeight - height - EDGE));
  }, [anchor.y, frameHeight, touchMode]);

  const left = Math.max(EDGE, Math.min(anchor.x, Math.max(EDGE, frameWidth - WIDTH - EDGE)));
  const style = touchMode ? undefined : { left, top, width: Math.min(WIDTH, Math.max(frameWidth - 16, 200)) };

  async function save() {
    if (empty || saving) return;
    setSaving(true);
    const ok = await onSave(text.trim());
    setSaving(false);
    if (!ok) inputRef.current?.focus();
  }

  return (
    <form
      ref={formRef}
      role="dialog"
      aria-label={`${messages.commentTitle}: ${blockName}`}
      className={touchMode ? `${styles.popover} ${styles.sheet}` : styles.popover}
      style={style}
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onCancel();
        }
      }}
    >
      <p className={styles.title}>{messages.commentTitle}</p>
      <Textarea
        ref={inputRef}
        rows={3}
        resize="none"
        value={text}
        aria-label={messages.commentTitle}
        placeholder={messages.commentPlaceholder}
        onChange={(event) => setText(event.target.value)}
        maxLength={1000}
      />
      <div className={styles.buttons}>
        <Button type="submit" variant="outline" size="sm" disabled={empty || saving}>
          {messages.commentSaveNote}
        </Button>
        <Button type="button" variant="accent" size="sm" disabled={empty || busy || saving} onClick={() => onAskAi(text.trim())}>
          {messages.commentAskAi}
        </Button>
        <Button type="button" variant="ivory" size="sm" onClick={onCancel}>
          {messages.commentCancel}
        </Button>
      </div>
    </form>
  );
}
