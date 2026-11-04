"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@ds/ui";
import type { Messages } from "../../../messages";
import styles from "./card-menu.module.css";

export function CardMenu({
  id,
  title,
  messages,
  onShare,
  onDelete,
}: {
  id: string;
  title: string;
  messages: Messages;
  onShare: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget && !rootRef.current?.contains(event.relatedTarget as Node)) setOpen(false);
    };
    const root = rootRef.current;
    document.addEventListener("pointerdown", onPointer);
    root?.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      root?.removeEventListener("focusout", onFocusOut);
    };
  }, [open]);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const moveFocus = (delta: number) => {
    const items = [...(rootRef.current?.querySelectorAll<HTMLElement>("[data-item]") ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);
    items[(index + delta + items.length) % items.length]?.focus();
  };

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-open={open || undefined}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          close(true);
        } else if (open && event.key === "ArrowDown") {
          event.preventDefault();
          moveFocus(1);
        } else if (open && event.key === "ArrowUp") {
          event.preventDefault();
          moveFocus(-1);
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        data-menu-trigger={id}
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={messages.cardMenu.replace("{title}", title)}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" className={styles.dots} aria-hidden="true" focusable="false">
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>
      {open ? (
        <ul id={listId} className={styles.list}>
          <li>
            <Link data-item href={`/i/${id}`} className={styles.item}>
              {messages.cardOpen}
            </Link>
          </li>
          <li>
            <button
              type="button"
              data-item
              className={styles.item}
              onClick={() => {
                setOpen(false);
                onShare();
              }}
            >
              <Icon name="share" />{messages.cardShare}
            </button>
          </li>
          <li>
            <a data-item href={`/i/${id}/download`} className={styles.item} download>
              {messages.cardDownload}
            </a>
          </li>
          <li>
            <button
              type="button"
              data-item
              className={`${styles.item} ${styles.danger}`}
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              <Icon name="trash" />{messages.cardDelete}
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
