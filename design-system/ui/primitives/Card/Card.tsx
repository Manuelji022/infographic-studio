import type { ComponentProps, ElementType } from "react";
import { cx } from "../../cx";
import styles from "./Card.module.css";

export type CardProps = ComponentProps<"div"> & {
  variant?: "surface" | "feature" | "deep" | "inverse";
  as?: "div" | "section" | "article" | "li";
};

export function Card({ variant = "surface", as = "div", className, ...props }: CardProps) {
  const Component = as as ElementType;

  return (
    <Component
      className={cx(styles.card, styles[variant], className)}
      {...props}
    />
  );
}

export type CardPartProps = ComponentProps<"div">;

export function CardHeader({ className, ...props }: CardPartProps) {
  return <div className={cx(styles.part, className)} {...props} />;
}

export function CardBody({ className, ...props }: CardPartProps) {
  return <div className={cx(styles.part, className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardPartProps) {
  return <div className={cx(styles.footer, className)} {...props} />;
}
