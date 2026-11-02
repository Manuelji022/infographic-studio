import type { ComponentProps } from "react";
import { cx } from "../../cx";
import styles from "./Link.module.css";

export type LinkTone = "default" | "inverse";

export type LinkProps = ComponentProps<"a"> & {
  tone?: LinkTone;
};

export function Link({
  tone = "default",
  className,
  ...props
}: LinkProps) {
  return (
    <a
      className={cx(styles.link, styles[tone], className)}
      {...props}
    />
  );
}
