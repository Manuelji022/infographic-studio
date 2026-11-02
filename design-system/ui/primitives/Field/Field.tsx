"use client";

import { createContext, useContext, useId } from "react";
import type { ReactNode } from "react";
import { Label } from "../Label";
import styles from "./Field.module.css";

export type FieldProps = {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  id?: string;
};

type FieldControlProps = {
  id: string;
  "aria-describedby": string;
  "aria-invalid": "true" | "false";
};

const FieldContext = createContext<FieldControlProps | null>(null);

export function useFieldControl(): Partial<FieldControlProps> {
  return useContext(FieldContext) ?? {};
}

export function Field({
  label,
  description,
  error,
  children,
  id,
}: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const descriptionId = `${controlId}-description`;
  const errorId = `${controlId}-error`;
  const describedBy = [description ? descriptionId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");
  const controlProps: FieldControlProps = {
    id: controlId,
    "aria-describedby": describedBy,
    "aria-invalid": error ? "true" : "false",
  };

  return (
    <div className={styles.root}>
      <Label htmlFor={controlId}>{label}</Label>
      <FieldContext.Provider value={controlProps}>
        {children}
      </FieldContext.Provider>
      {description && (
        <div id={descriptionId} className="ds-type-body-sm">
          {description}
        </div>
      )}
      {error && (
        <div id={errorId} role="alert" className={styles.error}>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className={styles.errorIcon}
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M8 4.5v4M8 11.25v.25" />
          </svg>
          <span className="ds-type-body-sm">{error}</span>
        </div>
      )}
    </div>
  );
}
