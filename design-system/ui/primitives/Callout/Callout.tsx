import type { ComponentProps, ElementType } from "react";
import { cx } from "../../cx";
import styles from "./Callout.module.css";

export type CalloutProps = Omit<ComponentProps<"aside">, "ref"> & {
  variant?: "note" | "highlight";
  as?: "div" | "aside";
};

export function Callout({
  variant = "note",
  as = "aside",
  className,
  ...props
}: CalloutProps) {
  const Component: ElementType = as;
  return (
    <Component
      className={cx(styles.callout, styles[variant], className)}
      {...props}
    />
  );
}
