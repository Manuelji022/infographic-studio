"use client";

import type { ComponentProps } from "react";
import { Button } from "../../primitives/Button";
import { Field } from "../../primitives/Field";
import { Select } from "../../primitives/Select";
import { Switch } from "../../primitives/Switch";
import styles from "./FilterBar.module.css";

export type FilterBarValues = {
  tag: string;
  date: string;
  language: string;
  sharedOnly: boolean;
};

export type FilterBarOption = { value: string; label: string };
export type FilterBarLabels = {
  tagLabel: string;
  dateLabel: string;
  languageLabel: string;
  sharedLabel: string;
  clear: string;
};
export type FilterBarProps = Omit<ComponentProps<"div">, "onChange"> & {
  values: FilterBarValues;
  onChange: (values: FilterBarValues) => void;
  labels: FilterBarLabels;
  tagOptions: FilterBarOption[];
  dateOptions: FilterBarOption[];
  languageOptions: FilterBarOption[];
  label: string;
};

export function FilterBar({
  values,
  onChange,
  labels,
  tagOptions,
  dateOptions,
  languageOptions,
  label,
  className,
  ...props
}: FilterBarProps) {
  const active = values.tag !== "" || values.date !== "" ||
    values.language !== "" || values.sharedOnly;
  const update = (key: keyof FilterBarValues, value: string | boolean) =>
    onChange({ ...values, [key]: value });
  const fields = [
    { key: "tag" as const, label: labels.tagLabel, options: tagOptions },
    { key: "date" as const, label: labels.dateLabel, options: dateOptions },
    { key: "language" as const, label: labels.languageLabel, options: languageOptions },
  ];

  return (
    <div
      {...props}
      role="group"
      aria-label={label}
      className={[styles.root, className].filter(Boolean).join(" ")}
    >
      {fields.map((field) => (
        <Field key={field.key} label={field.label}>
          <Select
            value={values[field.key]}
            onChange={(event) => update(field.key, event.currentTarget.value)}
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </Field>
      ))}
      <div className={styles.actions}>
        <Switch checked={values.sharedOnly} onChange={(event) =>
          update("sharedOnly", event.currentTarget.checked)}>
          {labels.sharedLabel}
        </Switch>
        {active ? (
          <Button variant="ghost" size="sm" onClick={() => onChange({
            tag: "", date: "", language: "", sharedOnly: false,
          })}>{labels.clear}</Button>
        ) : null}
      </div>
    </div>
  );
}
