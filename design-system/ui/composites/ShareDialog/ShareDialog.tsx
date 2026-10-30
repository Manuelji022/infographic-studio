"use client";

import { useEffect, useState } from "react";
import { Button } from "../../primitives/Button";
import { Dialog } from "../../primitives/Dialog";
import { Field } from "../../primitives/Field";
import { Icon } from "../../primitives/Icon";
import { Input } from "../../primitives/Input";
import { Select } from "../../primitives/Select";
import { Spinner } from "../../primitives/Spinner";
import { Text } from "../../primitives/Text";
import { VisuallyHidden } from "../../primitives/VisuallyHidden";
import styles from "./ShareDialog.module.css";

export type ShareExpiry = "never" | "7d" | "30d";
export type ShareDialogLabels = {
  title: string; description: string; create: string; creating: string;
  linkLabel: string; copy: string; copied: string; revoke: string;
  revoking: string; expiryLabel: string;
  expiryOptions: Record<ShareExpiry, string>; languageLabel: string;
  languageOptions: Array<{ value: string; label: string }>; close: string;
};
export type ShareDialogProps = {
  open: boolean; onClose: () => void; labels: ShareDialogLabels;
  url: string | null; expiry: ShareExpiry;
  onExpiryChange: (e: ShareExpiry) => void; language: string;
  onLanguageChange: (l: string) => void; onCreate: () => void;
  onRevoke: () => void; status?: "idle" | "creating" | "revoking";
};

export function ShareDialog(props: ShareDialogProps) {
  const { open, onClose, labels, url, expiry, onExpiryChange, language,
    onLanguageChange, onCreate, onRevoke, status = "idle" } = props;
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const copied = url !== null && copiedUrl === url;
  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopiedUrl(null), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url ?? "");
      setCopiedUrl(url);
    } catch {
      setCopiedUrl(null);
    }
  }
  return (
    <Dialog open={open} onClose={onClose} title={labels.title} footer={
      <Button variant="ivory" onClick={onClose}>{labels.close}</Button>
    }>
      <div className={styles.content}>
        <Text variant="body">{labels.description}</Text>
        <Field label={labels.expiryLabel}>
          <Select value={expiry} onChange={(event) =>
            onExpiryChange(event.target.value as ShareExpiry)}>
            {(["never", "7d", "30d"] as const).map((value) => (
              <option key={value} value={value}>{labels.expiryOptions[value]}</option>
            ))}
          </Select>
        </Field>
        <Field label={labels.languageLabel}>
          <Select value={language} onChange={(event) =>
            onLanguageChange(event.target.value)}>
            {labels.languageOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </Field>
        {url === null ? (
          <Button variant="ivory" onClick={onCreate} disabled={status !== "idle"}>
            {status === "creating" ? <Spinner size="sm" label={labels.creating} /> :
              labels.create}
          </Button>
        ) : (
          <div className={styles.link}>
            <Field label={labels.linkLabel}>
              <Input readOnly value={url} onFocus={(event) =>
                event.currentTarget.select()} />
            </Field>
            <Button variant="outline" onClick={copy} disabled={status !== "idle"}>
              <Icon name={copied ? "check" : "copy"} />
              {copied ? labels.copied : labels.copy}
            </Button>
            {copied ? <VisuallyHidden role="status">{labels.copied}</VisuallyHidden> : null}
            <Button variant="ghost" onClick={onRevoke} disabled={status !== "idle"}>
              {status === "revoking" ? <Spinner size="sm" label={labels.revoking} /> :
                labels.revoke}
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
