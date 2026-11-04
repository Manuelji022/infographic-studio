"use client";

import { useState, useSyncExternalStore } from "react";
import { ConfirmDialog, ShareDialog, type ShareExpiry } from "@ds/ui";
import { getMessages, type Locale } from "../../../messages";
import { createShareLink, revokeShareLink, updateShareLink } from "../../mocks/actions";
import type { ShareLink } from "../../mocks/types";
import styles from "./ShareController.module.css";

type Status = "idle" | "creating" | "saving" | "revoking";

function expiryOf(link: ShareLink | null): ShareExpiry {
  if (!link?.expiresAt) return "never";
  const days = (new Date(link.expiresAt).getTime() - Date.now()) / 86_400_000;
  return days <= 7 ? "7d" : "30d";
}

const languageOf = (link: ShareLink | null): string => link?.defaultLocale ?? "browser";

/** Identity of a link by value, so a new object with the same data does not reset the dialog. */
const keyOf = (link: ShareLink | null): string =>
  link ? [link.token, link.expiresAt, link.defaultLocale, link.revokedAt].join("|") : "none";

const toLocale = (value: string): Locale | null => (value === "es" || value === "en" ? value : null);

/** navigator.share exists only in the browser; the server render has no value (null). */
const subscribeNothing = () => () => {};
const canShareNatively = () => typeof navigator.share === "function";

/**
 * Share dialog wired to the share actions. Reusable from the workspace and the library card
 * menu: pass the infographic id, its current active link (or null) and control `open` from
 * the caller. Changes to `link` resync the dialog; language and expiry changes on an existing
 * link are saved with updateShareLink and keep the same token.
 */
export function ShareController({
  infographicId,
  link: linkProp,
  locale,
  open,
  onClose,
  onChange,
}: {
  infographicId: string;
  /** Active share link from the store; revoked or expired ones must be passed as null. */
  link: ShareLink | null;
  locale: Locale;
  open: boolean;
  onClose: () => void;
  /** Called after a link is created or saved (link) or revoked (null). */
  onChange?: (link: ShareLink | null) => void;
}) {
  const messages = getMessages(locale);
  const propKey = keyOf(linkProp);
  const [synced, setSynced] = useState(propKey);
  const [link, setLink] = useState<ShareLink | null>(linkProp);
  const [expiry, setExpiry] = useState<ShareExpiry>(expiryOf(linkProp));
  const [language, setLanguage] = useState<string>(languageOf(linkProp));
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  // Resync when the props change (state adjusted during render, no effect needed).
  if (propKey !== synced) {
    setSynced(propKey);
    setLink(linkProp);
    setExpiry(expiryOf(linkProp));
    setLanguage(languageOf(linkProp));
    setError(null);
  }

  const origin = useSyncExternalStore(subscribeNothing, () => window.location.origin, () => null);
  const nativeAvailable = useSyncExternalStore(subscribeNothing, canShareNatively, () => false);
  const url = link && origin ? `${origin}/s/${link.token}` : null;

  async function create(nextLanguage: string, nextExpiry: ShareExpiry) {
    setStatus("creating");
    setError(null);
    try {
      const result = await createShareLink(infographicId, {
        defaultLocale: toLocale(nextLanguage),
        expiresInDays: nextExpiry === "7d" ? 7 : nextExpiry === "30d" ? 30 : null,
      });
      if (result.ok) {
        setLink(result.data);
        onChange?.(result.data);
      } else setError(messages.shareError);
    } catch {
      setError(messages.shareError);
    }
    setStatus("idle");
  }

  /** Saves a change to an existing link; on failure the dialog returns to the previous value. */
  async function save(
    patch: { defaultLocale: Locale | null; expiresInDays?: 7 | 30 | null },
    revert: () => void,
  ) {
    setStatus("saving");
    setError(null);
    try {
      const result = await updateShareLink(infographicId, patch);
      if (result.ok) {
        setLink(result.data);
        onChange?.(result.data);
      } else {
        revert();
        setError(messages.shareError);
      }
    } catch {
      revert();
      setError(messages.shareError);
    }
    setStatus("idle");
  }

  function changeLanguage(next: string) {
    const previous = language;
    setLanguage(next);
    if (!link) return;
    void save({ defaultLocale: toLocale(next) }, () => setLanguage(previous));
  }

  function changeExpiry(next: ShareExpiry) {
    const previous = expiry;
    setExpiry(next);
    if (!link) return;
    void save(
      { defaultLocale: toLocale(language), expiresInDays: next === "7d" ? 7 : next === "30d" ? 30 : null },
      () => setExpiry(previous),
    );
  }

  async function revoke() {
    setStatus("revoking");
    setError(null);
    try {
      const result = await revokeShareLink(infographicId);
      if (result.ok) {
        setLink(null);
        onChange?.(null);
        setConfirmRevoke(false);
      } else setError(messages.shareError);
    } catch {
      setError(messages.shareError);
    }
    setStatus("idle");
  }

  async function nativeShare() {
    if (!url) return;
    try {
      await navigator.share({ url });
    } catch (caught) {
      // The user dismissing the sheet is not an error.
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError(messages.shareError);
    }
  }

  return (
    <>
      <ShareDialog
        open={open && !confirmRevoke}
        onClose={onClose}
        labels={{
          title: messages.shareDialogTitle,
          description: messages.shareDialogDescription,
          create: messages.shareCreate,
          creating: messages.shareCreating,
          linkLabel: messages.shareLinkLabel,
          copy: messages.shareCopy,
          copied: messages.shareCopied,
          copyFailed: messages.shareError,
          revoke: messages.shareRevoke,
          revoking: messages.shareRevoking,
          saving: messages.shareSaving,
          nativeShare: messages.shareNative,
          expiryLabel: messages.shareExpiryLabel,
          expiryOptions: {
            never: messages.shareExpiryNever,
            "7d": messages.shareExpiry7d,
            "30d": messages.shareExpiry30d,
          },
          languageLabel: messages.shareLanguageLabel,
          languageOptions: [
            { value: "browser", label: messages.shareLanguageBrowser },
            { value: "es", label: messages.languageSpanish },
            { value: "en", label: messages.languageEnglish },
          ],
          close: messages.workspaceClose,
        }}
        url={url}
        expiry={expiry}
        onExpiryChange={changeExpiry}
        language={language}
        onLanguageChange={changeLanguage}
        onCreate={() => void create(language, expiry)}
        onRevoke={() => setConfirmRevoke(true)}
        onNativeShare={nativeAvailable ? () => void nativeShare() : undefined}
        status={status}
        error={error}
      />
      <ConfirmDialog
        open={open && confirmRevoke}
        onClose={() => setConfirmRevoke(false)}
        onConfirm={() => void revoke()}
        title={messages.shareRevoke}
        description={
          <>
            {messages.shareRevokeConfirm}
            {error ? <span role="alert" className={styles.alert}>{error}</span> : null}
          </>
        }
        confirmLabel={messages.shareRevoke}
        cancelLabel={messages.deleteCancel}
        status={status === "revoking" ? "pending" : "idle"}
        spinnerLabel={messages.shareRevoking}
      />
    </>
  );
}
