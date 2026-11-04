"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./thumbnail.module.css";

const DOC_WIDTH = 1200;
const DOC_HEIGHT = 750; // 16:10, same ratio as the card thumbnail

/**
 * Non-interactive, scaled-down preview. The document comes from the preview route via
 * `src` with loading="lazy", so the browser fetches and renders it only near the viewport.
 */
export function Thumbnail({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setScale(node.clientWidth / DOC_WIDTH);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.frame} aria-hidden="true">
      <iframe
        title=""
        sandbox=""
        loading="lazy"
        tabIndex={-1}
        src={src}
        className={styles.iframe}
        style={{
          width: DOC_WIDTH,
          height: DOC_HEIGHT,
          transform: `scale(${scale ?? 0})`,
          visibility: scale === null ? "hidden" : "visible",
        }}
      />
    </div>
  );
}
