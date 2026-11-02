import type { ComponentProps } from "react";
import { cx } from "../../cx";
import styles from "./Label.module.css";

export type LabelProps = ComponentProps<"label">;

export function Label({ className, ...props }: LabelProps) {
  return <label {...props} className={cx(styles.root, className)} />;
}
