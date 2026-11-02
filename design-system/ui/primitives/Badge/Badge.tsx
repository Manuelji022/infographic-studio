import type { ComponentProps } from "react";
import { cx } from "../../cx";
import styles from "./Badge.module.css";

export type BadgeVariant = "neutral" | "outlined" | "solid";

export type BadgeProps = ComponentProps<"span"> & {
  variant?: BadgeVariant;
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cx("ds-type-caption-medium", styles.base, styles[variant], className)}
      {...props}
    />
  );
}
