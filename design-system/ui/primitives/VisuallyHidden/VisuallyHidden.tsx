import type { ComponentProps, ElementType } from "react";
import { cx } from "../../cx";
import styles from "./VisuallyHidden.module.css";

export type VisuallyHiddenProps = Omit<ComponentProps<"span">, "ref"> & {
  as?: "span" | "div";
};

export function VisuallyHidden({
  as = "span",
  className,
  ...props
}: VisuallyHiddenProps) {
  const Component: ElementType = as;
  return (
    <Component className={cx(styles.hidden, className)} {...props} />
  );
}
