import type { ComponentProps } from "react";
import { Icon } from "../../primitives/Icon";
import { Spinner } from "../../primitives/Spinner";
import { VisuallyHidden } from "../../primitives/VisuallyHidden";
import styles from "./GenerationProgress.module.css";

export type GenerationStepStatus = "pending" | "active" | "done" | "error";
export type GenerationStep = {
  key: string;
  label: string;
  status: GenerationStepStatus;
  statusLabel: string;
};
export type GenerationProgressProps = Omit<ComponentProps<"ol">, "children"> & {
  steps: GenerationStep[];
  label: string;
};

export function GenerationProgress({
  steps,
  label,
  className,
  ...props
}: GenerationProgressProps) {
  return (
    <ol
      aria-label={label}
      className={`${styles.list}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {steps.map((step) => (
        <li
          key={step.key}
          className={styles.step}
          aria-current={step.status === "active" ? "step" : undefined}
        >
          <span className={`${styles.marker} ${styles[step.status]}`}>
            {step.status === "active" ? <Spinner size="sm" label={step.statusLabel} /> : null}
            {step.status === "done" ? <Icon name="check" /> : null}
            {step.status === "error" ? <Icon name="alert" /> : null}
          </span>
          <span
            className={`${styles.label} ${
              step.status === "active" ? styles.activeLabel : ""
            } ${step.status === "pending" ? styles.pendingLabel : ""}`}
          >
            {step.label}
          </span>
          {step.status === "active" ? null : <VisuallyHidden>{step.statusLabel}</VisuallyHidden>}
        </li>
      ))}
    </ol>
  );
}
