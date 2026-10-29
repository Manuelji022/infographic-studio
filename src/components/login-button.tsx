"use client";

import { createAuthClient } from "better-auth/react";
import { useState } from "react";

const authClient = createAuthClient();

export function LoginButton({ label }: { label: string }) {
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
    <button type="button" onClick={signIn} disabled={pending}>
      {label}
    </button>
  );
}
