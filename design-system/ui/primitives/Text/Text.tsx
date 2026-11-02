import type { ComponentProps, ElementType } from "react";
import { cx } from "../../cx";
import styles from "./Text.module.css";

export type TextVariant =
  | "display"
  | "heading"
  | "subheading-serif"
  | "subheading-sans"
  | "title"
  | "body"
  | "body-lg"
  | "body-strong"
  | "body-sm"
  | "ui"
  | "ui-medium"
  | "ui-strong"
  | "ui-sm"
  | "caption"
  | "caption-medium"
  | "label"
  | "code";

export type TextTone = "default" | "muted" | "inverse";

export type TextProps = ComponentProps<"p"> & {
  variant?: TextVariant;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div" | "label" | "code";
  tone?: TextTone;
};

export function Text({
  variant = "body",
  as = "p",
  tone = "default",
  className,
  ...props
}: TextProps) {
  const Component = as as ElementType;

  return (
    <Component
      className={cx(`ds-type-${variant}`, styles[tone], className)}
      {...props}
    />
  );
}
