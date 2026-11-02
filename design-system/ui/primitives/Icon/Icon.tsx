import { useId } from "react";
import type { SVGProps } from "react";
import { paths } from "./iconPaths";
import type { IconName } from "./iconPaths";
import styles from "./Icon.module.css";

export type IconSize = "sm" | "md" | "lg";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "name" | "title"> & {
  name: IconName;
  size?: IconSize;
  title?: string;
};

export function Icon({
  name,
  size = "md",
  title,
  className,
  ...props
}: IconProps) {
  const titleId = useId();

  return (
    <svg
      viewBox="0 0 24 24"
      className={`${styles.icon} ${styles[size]}${className ? ` ${className}` : ""}`}
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-labelledby={title ? titleId : undefined}
      aria-hidden={title ? undefined : "true"}
      focusable="false"
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      {paths[name]}
    </svg>
  );
}
