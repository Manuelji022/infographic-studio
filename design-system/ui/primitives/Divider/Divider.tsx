import type { ComponentProps } from "react";
import { cx } from "../../cx";
import styles from "./Divider.module.css";

export type DividerProps = ComponentProps<"hr"> & {
  orientation?: "horizontal" | "vertical";
  tone?: "default" | "strong";
};

export function Divider({
  orientation = "horizontal",
  tone = "default",
  className,
  ...props
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cx(styles.vertical, styles[tone], className)}
      />
    );
  }

  return (
    <hr
      className={cx(styles.horizontal, styles[tone], className)}
      {...props}
    />
  );
}
