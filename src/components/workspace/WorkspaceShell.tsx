import type { ReactNode } from "react";
import styles from "./WorkspaceShell.module.css";

/**
 * Frame of the workspace (UI_EXPERIENCE §4.3): thin bar on top, main area and an optional
 * right slot for the chat panel. The slot is a column on desktop, an overlay from the right
 * below 1024 px and a bottom sheet below 640 px. The global app header is replaced by this
 * bar on /i/*.
 */
export function WorkspaceShell({
  bar,
  aside,
  asideId,
  asideOpen = false,
  overlay = false,
  onAsideDismiss,
  children,
}: {
  bar: ReactNode;
  aside?: ReactNode;
  asideId?: string;
  asideOpen?: boolean;
  /** Overlay or sheet mode: the page behind is made inert while the panel is open. */
  overlay?: boolean;
  /** Called when the overlay backdrop is pressed (overlay modes only). */
  onAsideDismiss?: () => void;
  children: ReactNode;
}) {
  const inert = overlay && asideOpen;
  return (
    <div className={styles.shell}>
      {bar}
      <div className={styles.body}>
        <main className={styles.main} inert={inert}>{children}</main>
        {aside && asideOpen ? (
          <>
            <div className={styles.backdrop} aria-hidden="true" onClick={onAsideDismiss} />
            <aside id={asideId} className={styles.aside}>
              {aside}
            </aside>
          </>
        ) : null}
      </div>
    </div>
  );
}
