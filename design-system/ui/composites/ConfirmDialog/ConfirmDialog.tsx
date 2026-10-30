"use client";

import type { ReactNode } from "react";
import { Button } from "../../primitives/Button";
import { Dialog } from "../../primitives/Dialog";
import { Spinner } from "../../primitives/Spinner";
import { Text } from "../../primitives/Text";

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  status?: "idle" | "pending";
  spinnerLabel?: string;
};

export function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmLabel, cancelLabel,
  status = "idle", spinnerLabel = confirmLabel,
}: ConfirmDialogProps) {
  const pending = status === "pending";
  return (
    <Dialog open={open} onClose={onClose} title={title} footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={pending}>{cancelLabel}</Button>
        <Button variant="ivory" onClick={onConfirm} disabled={pending}>
          {pending ? <Spinner size="sm" label={spinnerLabel} /> : confirmLabel}
        </Button>
      </>
    }>
      <Text variant="body">{description}</Text>
    </Dialog>
  );
}
