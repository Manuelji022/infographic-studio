import type { ComponentProps, ElementType } from "react";
import { cx } from "../../cx";
import { Icon } from "../Icon";
import styles from "./Callout.module.css";

export type CalloutProps = Omit<ComponentProps<"aside">, "ref"> & {
  variant?: "note" | "highlight" | "danger";
  as?: "div" | "aside";
};

export function Callout({
  variant = "note",
  as = "aside",
  className,
  children,
  ...props
}: CalloutProps) {
  const Component: ElementType = as;
  return (
    <Component
      className={cx(styles.callout, styles[variant], className)}
      {...props}
    >
      {variant === "danger" ? <Icon name="alert" className={styles.dangerIcon} /> : null}
      {variant === "danger" ? <span>{children}</span> : children}
    </Component>
  );
}
