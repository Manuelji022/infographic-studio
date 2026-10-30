import type { ComponentProps } from "react";
import { cx } from "../../cx";
import styles from "./Spinner.module.css";

export type SpinnerProps = Omit<ComponentProps<"span">, "children"> & {
  size?: "sm" | "md" | "lg";
  label: string;
};

export function Spinner({
  size = "md",
  label,
  className,
  ...props
}: SpinnerProps) {
  return (
    <span role="status" className={cx(styles.status, className)} {...props}>
      <svg
        className={cx(styles.spinner, styles[size])}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="42 15"
        />
      </svg>
      <span className={styles.hidden}>{label}</span>
    </span>
  );
}
