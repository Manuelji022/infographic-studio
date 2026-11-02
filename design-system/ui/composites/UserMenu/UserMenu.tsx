"use client";

import { useId, useRef } from "react";
import type { ComponentProps, CSSProperties } from "react";
import { Icon } from "../../primitives/Icon";
import { Divider } from "../../primitives/Divider";
import styles from "./UserMenu.module.css";

export type UserMenuItem = { key: string; label: string; href?: string; onSelect?: () => void };
export type UserMenuProps = Omit<ComponentProps<"div">, "children"> & {
  name: string;
  email?: string;
  triggerLabel: string;
  items: UserMenuItem[];
};

export function UserMenu({ name, email, triggerLabel, items, className, ...props }: UserMenuProps) {
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // One anchor name per instance so several menus on a page do not share an anchor.
  const anchor = `--ds-user-menu-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const triggerStyle = { anchorName: anchor } as CSSProperties;
  const panelStyle = { positionAnchor: anchor } as CSSProperties;
  return (
    <div {...props} className={`${styles.root}${className ? ` ${className}` : ""}`}>
      <button type="button" popoverTarget={id} aria-label={triggerLabel}
        className={styles.trigger} style={triggerStyle}>
        <Icon name="user" size="sm" />
        <span className={styles.name}>{name}</span>
      </button>
      <div id={id} ref={panelRef} popover="auto" className={styles.panel}
        style={panelStyle}>
        <header className={styles.header}>
          <div className="ds-type-ui-strong">{name}</div>
          {email ? <div className={`ds-type-caption ${styles.email}`}>{email}</div> : null}
        </header>
        <Divider />
        <ul className={styles.items}>
          {items.map((item) => (
            <li key={item.key}>
              {item.href ? (
                <a className={styles.item} href={item.href}>{item.label}</a>
              ) : item.onSelect ? (
                <button type="button" className={styles.item} onClick={() => {
                  item.onSelect?.();
                  panelRef.current?.hidePopover();
                }}>{item.label}</button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
