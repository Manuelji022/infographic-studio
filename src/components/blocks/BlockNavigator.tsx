"use client";

import { useId, useState, type KeyboardEvent } from "react";
import type { Messages } from "../../../messages";
import { blockTypeLabel } from "../chat/block-labels";
import type { BlockInfo } from "./types";
import styles from "./BlockNavigator.module.css";

/**
 * Keyboard route into the document. Focus cannot go inside the iframe (no scripts, nothing
 * focusable), so the blocks are also a roving-focus listbox OUTSIDE it: Tab reaches the list,
 * Up/Down (Home/End) move through the blocks and outline the current one in the document,
 * Enter or Space selects it and Esc clears the selection. It is hidden until it has focus.
 * The next Tab stop after it is the toolbar of the selected block.
 */
export function BlockNavigator({
  messages,
  label,
  blocks,
  selectedId,
  onPreview,
  onSelect,
}: {
  messages: Messages;
  label: string;
  blocks: BlockInfo[];
  selectedId: string | null;
  /** Block being looked at with the arrows (outlined in the document), or null on blur. */
  onPreview: (id: string | null) => void;
  onSelect: (id: string | null) => void;
}) {
  const listId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const active = blocks[Math.min(activeIndex, blocks.length - 1)];
  const optionId = (id: string) => `${listId}-${id}`;

  function move(index: number) {
    const next = Math.max(0, Math.min(blocks.length - 1, index));
    setActiveIndex(next);
    onPreview(blocks[next]?.id ?? null);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") move(activeIndex + 1);
    else if (event.key === "ArrowUp") move(activeIndex - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(blocks.length - 1);
    else if (event.key === "Enter" || event.key === " ") {
      if (active) onSelect(active.id);
    } else if (event.key === "Escape") {
      onSelect(null);
      return;
    } else return;
    event.preventDefault();
  }

  if (blocks.length === 0) return null;
  return (
    <div className={focused ? styles.nav : `${styles.nav} ${styles.hidden}`}>
      <ul
        role="listbox"
        tabIndex={0}
        className={styles.list}
        aria-label={label}
        aria-activedescendant={active ? optionId(active.id) : undefined}
        data-block-nav
        onKeyDown={onKeyDown}
        onFocus={() => {
          setFocused(true);
          onPreview(active?.id ?? null);
        }}
        onBlur={() => {
          setFocused(false);
          onPreview(null);
        }}
      >
        {blocks.map((block) => (
          <li
            key={block.id}
            id={optionId(block.id)}
            role="option"
            aria-selected={block.id === selectedId}
            className={`${styles.option}${block.nested ? ` ${styles.nested}` : ""}${block.id === active?.id ? ` ${styles.active}` : ""}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(block.id)}
          >
            <span className={styles.kind}>{blockTypeLabel(messages, block.type)}</span> {block.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
