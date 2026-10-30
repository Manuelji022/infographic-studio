import type { ComponentProps, ReactNode } from "react";
import { Icon } from "../../primitives/Icon";
import type { IconName } from "../../primitives/Icon";
import { Text } from "../../primitives/Text";
import styles from "./EmptyState.module.css";

export type EmptyStateProps = Omit<ComponentProps<"div">, "title"> & {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: IconName;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div className={`${styles.state}${className ? ` ${className}` : ""}`} {...props}>
      {icon ? <Icon name={icon} className={styles.icon} /> : null}
      <Text as="h2" variant="title">{title}</Text>
      {description ? <Text variant="body-sm" tone="muted">{description}</Text> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
