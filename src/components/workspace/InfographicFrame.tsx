"use client";

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from "react";
import { FrameContext } from "../blocks/frame-context";
import styles from "./InfographicFrame.module.css";

export type FrameTheme = "light" | "dark" | "auto";

/** Imperative API the workspace uses to point at blocks inside the document. */
export type InfographicFrameHandle = {
  /** Scrolls the block into view and outlines it briefly. Returns false when it is not found. */
  highlightBlock: (id: string) => boolean;
  /** Scrolls the block to the middle of the viewport (no outline). Returns false when it is not found. */
  scrollToBlock: (id: string) => boolean;
};

const FLASH_MS = 1200;

/** Replaces the body (and the stylesheet, if charts changed it) without reloading the frame. */
function swapDocument(doc: Document, html: string) {
  const next = new DOMParser().parseFromString(html, "text/html");
  const style = doc.head.querySelector("style");
  const nextStyle = next.head.querySelector("style");
  if (style && nextStyle && style.textContent !== nextStyle.textContent) {
    style.textContent = nextStyle.textContent;
  }
  doc.body.innerHTML = next.body.innerHTML;
}

/**
 * Sandboxed iframe (no allow-scripts, and no script injected) that grows to its content.
 * `allow-same-origin` is safe here because nothing in the document can run; the parent reads
 * its height, sets the theme attribute, reads the block roots to draw the interaction layer
 * (`children`, positioned over the frame) and, when `srcDoc` changes, swaps the body in place
 * so an edit never reloads the frame.
 */
export function InfographicFrame({
  srcDoc,
  title,
  theme = "auto",
  loading,
  handle,
  children,
}: {
  srcDoc: string;
  title: string;
  theme?: FrameTheme;
  loading?: string;
  handle?: Ref<InfographicFrameHandle>;
  /** Overlay layer, rendered over the frame (see BlockLayer). */
  children?: ReactNode;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);
  const flashed = useRef<HTMLElement | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [frameEl, setFrameEl] = useState<HTMLDivElement | null>(null);
  const [iframeEl, setIframeEl] = useState<HTMLIFrameElement | null>(null);
  const [revision, setRevision] = useState(0);
  // The attribute never changes after mount (a change would reload the frame); `latest` is
  // what the document should show and `shown` what it currently shows.
  const [initialDoc] = useState(srcDoc);
  const latest = useRef(srcDoc);
  const shown = useRef(srcDoc);

  const sync = useCallback(() => {
    const doc = ref.current?.contentDocument;
    if (!doc?.documentElement) return;
    doc.documentElement.dataset.dsTheme = theme;
    setHeight(Math.ceil(doc.documentElement.scrollHeight));
    setRevision((value) => value + 1);
  }, [theme]);

  const patch = useCallback(() => {
    const doc = ref.current?.contentDocument;
    if (!doc?.body || shown.current === latest.current) return;
    swapDocument(doc, latest.current);
    shown.current = latest.current;
    flashed.current = null;
    sync();
  }, [sync]);

  const onLoad = useCallback(() => {
    shown.current = initialDoc;
    patch();
    sync();
    observer.current?.disconnect();
    const body = ref.current?.contentDocument?.body;
    if (!body) return;
    observer.current = new ResizeObserver(sync);
    observer.current.observe(body);
  }, [initialDoc, patch, sync]);

  // Keys pressed while focus is inside the frame never reach the parent's window listeners, so
  // they are re-dispatched on the parent window (Escape closes the chat overlay, deselects, etc.).
  useEffect(() => {
    const doc = iframeEl?.contentDocument;
    if (!doc) return;
    const forward = (event: KeyboardEvent) => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: event.key,
          code: event.code,
          shiftKey: event.shiftKey,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          altKey: event.altKey,
          bubbles: true,
          cancelable: true,
        }),
      );
    };
    doc.addEventListener("keydown", forward);
    return () => doc.removeEventListener("keydown", forward);
  }, [iframeEl, revision]);

  useEffect(() => {
    // The iframe may already be loaded when hydration reaches it.
    if (ref.current?.contentDocument?.readyState === "complete") onLoad();
    return () => observer.current?.disconnect();
  }, [onLoad]);

  useEffect(() => {
    latest.current = srcDoc;
    if (ref.current?.contentDocument?.readyState === "complete") patch();
  }, [srcDoc, patch]);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  useImperativeHandle(
    handle,
    () => ({
      scrollToBlock(id) {
        const block = ref.current?.contentDocument?.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(id)}"]`);
        if (!block) return false;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        block.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
        return true;
      },
      highlightBlock(id) {
        const doc = ref.current?.contentDocument;
        const block = doc?.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(id)}"]`);
        if (!doc || !block) return false;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        block.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
        if (flashed.current && flashed.current !== block) flashed.current.style.removeProperty("outline");
        window.clearTimeout(flashTimer.current);
        block.style.outline = "2px solid var(--ds-focus-ring)";
        block.style.outlineOffset = "4px";
        flashed.current = block;
        flashTimer.current = window.setTimeout(() => {
          block.style.removeProperty("outline");
          block.style.removeProperty("outline-offset");
          if (flashed.current === block) flashed.current = null;
        }, FLASH_MS);
        return true;
      },
    }),
    [],
  );

  const context = useMemo(() => ({ iframe: iframeEl, frame: frameEl, revision }), [iframeEl, frameEl, revision]);

  return (
    <div ref={setFrameEl} className={styles.frame} aria-busy={height === null}>
      {height === null && loading ? <span className={styles.status} role="status">{loading}</span> : null}
      <iframe
        ref={(element) => {
          ref.current = element;
          setIframeEl(element);
        }}
        title={title}
        sandbox="allow-same-origin"
        tabIndex={-1}
        srcDoc={initialDoc}
        onLoad={onLoad}
        className={styles.iframe}
        style={{ height: height ?? "75vh" }}
        referrerPolicy="no-referrer"
      />
      <FrameContext.Provider value={context}>{children}</FrameContext.Provider>
    </div>
  );
}
