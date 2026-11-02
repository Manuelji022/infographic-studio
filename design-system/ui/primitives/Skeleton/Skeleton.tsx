import type { ComponentProps, CSSProperties } from "react";
import { cx } from "../../cx";
import styles from "./Skeleton.module.css";

export type SkeletonProps = ComponentProps<"div"> & {
  variant?: "text" | "block" | "circle";
  width?: string;
  height?: string;
};

type SkeletonStyle = CSSProperties & {
  "--ds-skeleton-width"?: string;
  "--ds-skeleton-height"?: string;
};

export function Skeleton({
  variant = "text",
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  const skeletonStyle: SkeletonStyle = {
    ...style,
    ...(width ? { "--ds-skeleton-width": width } : {}),
    ...(height ? { "--ds-skeleton-height": height } : {}),
  };

  return (
    <div
      aria-hidden="true"
      className={cx(styles.skeleton, styles[variant], className)}
      style={skeletonStyle}
      {...props}
    />
  );
}
