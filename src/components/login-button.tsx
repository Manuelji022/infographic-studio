"use client";

import { useState } from "react";
import { Button, Spinner } from "@ds/ui";
import { authClient } from "../lib/auth-client";

export function LoginButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    try {
      await authClient.signIn.social({ provider: "google" });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="accent" onClick={signIn} disabled={pending}>
      {pending ? <Spinner size="sm" label={pendingLabel} /> : label}
    </Button>
  );
}
