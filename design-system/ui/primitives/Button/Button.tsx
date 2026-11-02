import type { ComponentProps } from "react";
import { cx } from "../../cx";
import styles from "./Button.module.css";

export type ButtonVariant =
  | "accent"
  | "ivory"
  | "outline"
  | "ghost";

export type ButtonSize = "md" | "sm";

export type ButtonTone = "default" | "inverse";

export type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
};

export function Button({
  variant = "ivory",
  size = "md",
  tone = "default",
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        styles.button,
        styles[variant],
        styles[size],
        tone === "inverse" && styles.inverse,
        className,
      )}
      type={type}
      {...props}
    />
  );
}
