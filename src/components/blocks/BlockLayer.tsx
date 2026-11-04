"use client";

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Spinner } from "@ds/ui";
import type { Messages } from "../../../messages";
import { blockTypeLabel } from "../chat/block-labels";
import { BackIcon, CommentIcon, RegenerateIcon, SparkIcon } from "./block-icons";
import { BlockNavigator } from "./BlockNavigator";
import { CommentPopover } from "./CommentPopover";
import { FrameContext } from "./frame-context";
import type { BlockInfo, Rect } from "./types";
import styles from "./BlockLayer.module.css";

export type BlockLayerProps = {
  messages: Messages;
  blocks: BlockInfo[];
  selectedId: string | null;
  /** Phone/tablet or coarse pointer: tap selects and the actions live in a bottom bar. */
  touchMode: boolean;
  /** Block with a request in flight (veil + spinner). */
  workingId: string | null;
  /** Block that has just been updated (brief highlight). */
  updated: { id: string; stamp: number } | null;
  /** Notes per block id. */
  commentCounts: Readonly<Record<string, number>>;
  /** A request is running somewhere: actions that start one are disabled. */
  busy: boolean;
  /** Block whose latest applied edit can be undone from its toolbar. */
  undoBlockId: string | null;
  commentOpenId: string | null;
  /** Accessible name of the keyboard block list (see BlockNavigator). */
  navLabel: string;
  /** Hide the touch action bar (a modal chat is open over the page). */
  barHidden?: boolean;
  onSelect: (id: string | null) => void;
  /** Scrolls a block into view (keyboard preview). */
  onReveal: (id: string) => void;
  onComment: (id: string) => void;
  onEdit: (id: string) => void;
  onRegenerate: (id: string) => void;
  onUndo: () => void;
  onCloseComment: (restoreFocus: boolean) => void;
  onSaveNote: (id: string, text: string) => Promise<boolean>;
  onAskAi: (id: string, text: string) => void;
};

const HOVER_GRACE_MS = 140;

function sameRects(a: Record<string, Rect>, b: Record<string, Rect>): boolean {
  const keys = Object.keys(b);
  if (keys.length !== Object.keys(a).length) return false;
  return keys.every((key) => {
    const x = a[key];
    const y = b[key];
    return x && x.x === y.x && x.y === y.y && x.w === y.w && x.h === y.h;
  });
}

/**
 * Interaction layer over the iframe (UI_EXPERIENCE §4.3, decision D5). The iframe gets no
 * script: this component reads its (same-origin) document directly, measures every
 * `[data-block-id]` root, and listens to pointer events on that document from the parent.
 * Everything drawn here lives outside the iframe, so the document itself is never altered.
 */
export function BlockLayer(props: BlockLayerProps) {
  const { messages, blocks, selectedId, touchMode, workingId, updated, commentCounts, busy, commentOpenId } = props;
  const { iframe, frame, revision } = useContext(FrameContext);
  const [rects, setRects] = useState<Record<string, Rect>>({});
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const hoverTimer = useRef<number | undefined>(undefined);
  const raf = useRef(0);
  const latest = useRef({ blocks, onSelect: props.onSelect, touchMode });
  useEffect(() => {
    latest.current = { blocks, onSelect: props.onSelect, touchMode };
  });

  const measure = useCallback(() => {
    const doc = iframe?.contentDocument;
    if (!iframe || !frame || !doc?.body) return;
    const f = frame.getBoundingClientRect();
    const i = iframe.getBoundingClientRect();
    const ox = i.left - f.left + iframe.clientLeft;
    const oy = i.top - f.top + iframe.clientTop;
    const next: Record<string, Rect> = {};
    for (const block of latest.current.blocks) {
      const element = doc.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(block.id)}"]`);
      if (!element) continue;
      const r = element.getBoundingClientRect();
      next[block.id] = { x: Math.round(ox + r.left), y: Math.round(oy + r.top), w: Math.round(r.width), h: Math.round(r.height) };
    }
    setRects((previous) => (sameRects(previous, next) ? previous : next));
  }, [iframe, frame]);

  const schedule = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(measure);
  }, [measure]);

  // Measure again on load, patch, resize (revision), block list change, window resize and scroll.
  useEffect(() => {
    schedule();
  }, [schedule, revision, blocks]);

  useEffect(() => {
    const doc = iframe?.contentDocument;
    if (!iframe || !frame || !doc?.body) return;
    const observer = new ResizeObserver(schedule);
    observer.observe(frame);
    observer.observe(doc.body);
    doc.querySelectorAll("[data-block-id]").forEach((element) => observer.observe(element));
    window.addEventListener("resize", schedule);
    iframe.contentWindow?.addEventListener("scroll", schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      iframe.contentWindow?.removeEventListener("scroll", schedule);
      cancelAnimationFrame(raf.current);
    };
  }, [iframe, frame, schedule, revision, blocks]);

  const clearHoverSoon = useCallback(() => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setHoverId(null), HOVER_GRACE_MS);
  }, []);
  const keepHover = useCallback(() => window.clearTimeout(hoverTimer.current), []);
  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  // Pointer, click and key listeners on the iframe document, attached from the parent.
  useEffect(() => {
    const doc = iframe?.contentDocument;
    if (!doc?.documentElement) return;
    const known = () => new Set(latest.current.blocks.map((block) => block.id));
    const blockAt = (target: EventTarget | null): string | null => {
      // The target belongs to the iframe's realm, so `instanceof Element` would be false here.
      const element = (target as Element | null)?.closest?.("[data-block-id]") ?? null;
      const id = element?.getAttribute("data-block-id") ?? null;
      return id && known().has(id) ? id : null;
    };
    const onMove = (event: PointerEvent | MouseEvent) => {
      if (latest.current.touchMode || ("pointerType" in event && event.pointerType === "touch")) return;
      window.clearTimeout(hoverTimer.current);
      const id = blockAt(event.target);
      if (id) setHoverId(id);
      else clearHoverSoon();
    };
    const onLeave = () => clearHoverSoon();
    const onClick = (event: MouseEvent) => {
      latest.current.onSelect(blockAt(event.target));
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") latest.current.onSelect(null);
    };
    doc.addEventListener("pointermove", onMove);
    doc.documentElement.addEventListener("pointerleave", onLeave);
    doc.addEventListener("click", onClick);
    doc.addEventListener("keydown", onKey);
    return () => {
      doc.removeEventListener("pointermove", onMove);
      doc.documentElement.removeEventListener("pointerleave", onLeave);
      doc.removeEventListener("click", onClick);
      doc.removeEventListener("keydown", onKey);
    };
  }, [iframe, revision, clearHoverSoon]);

  const byId = new Map(blocks.map((block) => [block.id, block]));
  const rectOf = (id: string | null) => (id ? rects[id] : undefined);
  const hovered = previewId ?? (touchMode ? null : hoverId);
  const shownHover = hovered && hovered !== selectedId ? hovered : null;
  const selected = selectedId ? byId.get(selectedId) : undefined;
  const label = (block: BlockInfo) => `${blockTypeLabel(messages, block.type)}: ${block.name}`;

  function toolbar(block: BlockInfo, className: string) {
    const disabled = busy;
    return (
      <div
        className={className}
        role="toolbar"
        aria-label={messages.blockActions.replace("{name}", block.name)}
        onPointerEnter={keepHover}
        onPointerLeave={clearHoverSoon}
      >
        <button type="button" className={styles.action} disabled={disabled} title={messages.blockActionComment} data-action="comment" onClick={() => props.onComment(block.id)}>
          <CommentIcon />
          <span className={styles.actionText}>{messages.blockActionComment}</span>
        </button>
        <button type="button" className={styles.action} title={messages.blockActionEdit} data-action="edit" onClick={() => props.onEdit(block.id)}>
          <SparkIcon />
          <span className={styles.actionText}>{messages.blockActionEdit}</span>
        </button>
        <button type="button" className={styles.action} disabled={disabled} title={messages.blockActionRegenerate} data-action="regenerate" onClick={() => props.onRegenerate(block.id)}>
          <RegenerateIcon />
          <span className={styles.actionText}>{messages.blockActionRegenerate}</span>
        </button>
        {props.undoBlockId === block.id ? (
          <button type="button" className={styles.action} disabled={disabled} title={messages.historyUndo} data-action="undo" onClick={props.onUndo}>
            <BackIcon />
            <span className={styles.actionText}>{messages.historyUndo}</span>
          </button>
        ) : null}
      </div>
    );
  }

  function outline(block: BlockInfo, rect: Rect, kind: "hover" | "selected", hoverToolbar = false) {
    return (
      <div key={`${kind}-${block.id}`} className={`${styles.outline} ${kind === "selected" ? styles.selected : styles.hover}`} style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }} data-block-outline={kind} data-outline-block={block.id}>
        <span className={rect.y >= 22 ? `${styles.tag} ${styles.tagAbove}` : styles.tag}>{label(block)}</span>
        {!touchMode && (kind === "selected" || hoverToolbar) ? toolbar(block, styles.toolbar) : null}
      </div>
    );
  }

  const hoverBlock = shownHover ? byId.get(shownHover) : undefined;
  const hoverRect = rectOf(shownHover);
  const selectedRect = rectOf(selectedId);
  const workingBlock = workingId ? byId.get(workingId) : undefined;
  const workingRect = rectOf(workingId);
  const updatedRect = rectOf(updated?.id ?? null);
  const popoverBlock = commentOpenId ? byId.get(commentOpenId) : undefined;
  const popoverRect = rectOf(commentOpenId);

  return (
    <>
      <BlockNavigator
        messages={messages}
        label={props.navLabel}
        blocks={blocks}
        selectedId={selectedId}
        onPreview={(id) => {
          setPreviewId(id);
          if (id) props.onReveal(id);
        }}
        onSelect={(id) => {
          setPreviewId(null);
          props.onSelect(id);
        }}
      />
      <div className={styles.layer} data-block-layer>
        {Object.entries(commentCounts).map(([id, count]) => {
          const rect = rects[id];
          const block = byId.get(id);
          if (!rect || !block || count === 0) return null;
          return (
            <button
              key={`badge-${id}`}
              type="button"
              className={styles.badge}
              style={{ left: rect.x + rect.w, top: rect.y + rect.h }}
              aria-label={`${messages.commentCount.replace("{count}", String(count))} — ${block.name}`}
              onClick={() => props.onSelect(id)}
            >
              {count}
            </button>
          );
        })}
        {hoverBlock && hoverRect ? outline(hoverBlock, hoverRect, "hover", previewId === null) : null}
        {selected && selectedRect ? outline(selected, selectedRect, "selected") : null}
        {updated && updatedRect ? (
          <div key={`updated-${updated.stamp}`} className={styles.updated} style={{ left: updatedRect.x, top: updatedRect.y, width: updatedRect.w, height: updatedRect.h }} data-block-updated={updated.id} aria-hidden="true" />
        ) : null}
        {workingBlock && workingRect ? (
          <div className={styles.veil} style={{ left: workingRect.x, top: workingRect.y, width: workingRect.w, height: workingRect.h }} data-block-working={workingBlock.id}>
            <Spinner size="sm" label={messages.blockWorking} />
            <span aria-hidden="true">{messages.blockWorking}</span>
          </div>
        ) : null}
        {popoverBlock && popoverRect ? (
          <CommentPopover
            messages={messages}
            anchor={popoverRect}
            frameWidth={frame?.clientWidth ?? 0}
            frameHeight={frame?.clientHeight ?? 0}
            touchMode={touchMode}
            blockName={popoverBlock.name}
            busy={busy}
            onCancel={() => props.onCloseComment(true)}
            onSave={(text) => props.onSaveNote(popoverBlock.id, text)}
            onAskAi={(text) => props.onAskAi(popoverBlock.id, text)}
          />
        ) : null}
      </div>
      {touchMode && selected && !commentOpenId && !props.barHidden ? (
        <div className={styles.bar}>
          <span className={styles.barName}>{label(selected)}</span>
          {toolbar(selected, styles.barActions)}
        </div>
      ) : null}
      <div className={styles.srOnly} role="status" aria-live="polite">
        {selected ? messages.blockSelected.replace("{name}", selected.name) : ""}
      </div>
    </>
  );
}
