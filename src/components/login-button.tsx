"use client";

import { useState } from "react";
import { Button, ErrorMessage, Spinner } from "@ds/ui";
import { authClient } from "../lib/auth-client";

export function LoginButton({
  label,
  retryLabel,
  pendingLabel,
  errorLabel,
  retry = false,
}: {
  label: string;
  retryLabel: string;
  pendingLabel: string;
  errorLabel: string;
  /** True when the server page already shows a failed sign-in (?error=...). */
  retry?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  function fail() {
    setPending(false);
    setFailed(true);
  }

  async function signIn() {
    setPending(true);
    setFailed(false);
    try {
      // Failed OAuth callbacks come back to /login with ?error=<code>, handled by the page.
      const result = await authClient.signIn.social({
        provider: "google",
        errorCallbackURL: "/login",
      });
      // On success the browser is redirected to Google, so pending stays on.
      if (result?.error) fail();
    } catch {
      fail();
    }
  }

  const showRetry = failed || retry;

  return (
    <>
      {failed ? (
        <ErrorMessage live="assertive" focusAction={false}>{errorLabel}</ErrorMessage>
      ) : null}
      <Button variant="accent" onClick={signIn} disabled={pending}>
        {pending ? (
          <Spinner size="sm" label={pendingLabel} />
        ) : showRetry ? (
          retryLabel
        ) : (
          label
        )}
      </Button>
    </>
  );
}
