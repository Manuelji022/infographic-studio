import type { ComponentProps, ReactNode } from "react";
import styles from "./AppHeader.module.css";

export type AppHeaderNavItem = {
  key: string;
  label: string;
  href: string;
  current?: boolean;
};

export type AppHeaderProps = Omit<ComponentProps<"header">, "children"> & {
  brand: ReactNode;
  navLabel: string;
  items: AppHeaderNavItem[];
  actions?: ReactNode;
};

export function AppHeader({
  brand,
  navLabel,
  items,
  actions,
  className,
  ...props
}: AppHeaderProps) {
  return (
    <header {...props} className={`${styles.header}${className ? ` ${className}` : ""}`}>
      <div className={styles.inner}>
        <div className={styles.brand}>{brand}</div>
        {items.length > 0 ? (
          <nav aria-label={navLabel} className={styles.nav}>
            {items.map((item) => (
              <a
                key={item.key}
                href={item.href}
                aria-current={item.current ? "page" : undefined}
                className={`${styles.link}${item.current ? ` ${styles.current}` : ""}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </header>
  );
}
