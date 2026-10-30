"use client";

import { useEffect, useId, useRef } from "react";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "../../cx";
import styles from "./Dialog.module.css";

export type DialogProps = Omit<ComponentProps<"dialog">, "open" | "onClose" | "title"> & {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  onClick,
  onCancel,
  ref,
  ...props
}: DialogProps) {
  const innerRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // The parent owns the state: open/close the native dialog to match the `open` prop.
  useEffect(() => {
    const dialog = innerRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function setRefs(node: HTMLDialogElement | null) {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  }

  return (
    <dialog
      {...props}
      ref={setRefs}
      aria-labelledby={titleId}
      className={cx(styles.dialog, className)}
      onCancel={(event) => {
        // Escape: let the parent decide, so onClose runs once and the effect closes the dialog.
        event.preventDefault();
        onCancel?.(event);
        onClose();
      }}
      onClose={() => {
        // Closed natively (for example by a <form method="dialog">) while still "open".
        if (open) onClose();
      }}
      onClick={(event) => {
        // The dialog has no padding of its own, so only a click on the backdrop targets it.
        if (event.target === event.currentTarget) onClose();
        onClick?.(event);
      }}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 id={titleId} className="ds-type-title">
            {title}
          </h2>
        </header>
        <div className={styles.body}>{children}</div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </dialog>
  );
}
