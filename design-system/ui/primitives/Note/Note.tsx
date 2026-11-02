import type { ComponentProps, ReactNode } from "react";
import { cx } from "../../cx";
import { Icon } from "../Icon";
import type { IconName } from "../Icon/iconPaths";
import styles from "./Note.module.css";

export type NoteVariant = "default" | "secondary" | "success" | "warning" | "error";
export type NoteSize = "default" | "small";
export type NoteAppearance = "outline" | "fill";

export type NoteProps = Omit<ComponentProps<"div">, "children"> & {
  children: ReactNode;
  variant?: NoteVariant;
  size?: NoteSize;
  /** `fill` tints the background with the variant color; `outline` only draws the border. */
  appearance?: NoteAppearance;
  /** Overrides the variant icon; `null` renders no icon. */
  icon?: IconName | null;
  /** Short bold prefix (one or two words). */
  label?: string;
  /** A single inline call to action, for example a small Button. */
  action?: ReactNode;
};

const defaultIcons: Record<NoteVariant, IconName> = {
  default: "info",
  secondary: "info",
  success: "success",
  warning: "warning",
  error: "alert",
};

export function Note({
  children,
  variant = "default",
  size = "default",
  appearance = "outline",
  icon,
  label,
  action,
  className,
  ...props
}: NoteProps) {
  const iconName = icon === undefined ? defaultIcons[variant] : icon;

  return (
    <div
      {...props}
      className={cx(styles.note, styles[variant], styles[size], styles[appearance], className)}
    >
      {iconName ? <Icon name={iconName} className={styles.icon} /> : null}
      <p className={styles.content}>
        {label ? <strong className={styles.label}>{label}: </strong> : null}
        {children}
      </p>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
