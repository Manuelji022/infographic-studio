"use client";

import { useState } from "react";
import type { CatalogSectionProps } from "../types";
import { ConfirmDialog } from "../../ui/composites/ConfirmDialog";
import { ShareDialog } from "../../ui/composites/ShareDialog";
import type { ShareExpiry } from "../../ui/composites/ShareDialog";
import { Button } from "../../ui/primitives/Button";
import styles from "./DialogsSection.module.css";

const copy = {
  es: {
    confirm: "Confirmación", title: "Borrar infografía",
    warning: "Esta acción no se puede deshacer.", confirmLabel: "Borrar",
    cancel: "Cancelar", spinner: "Borrando…", idle: "Estado inactivo",
    pending: "Estado pendiente con indicador de carga.",
    open: "Borrar infografía", openPending: "Abrir estado pendiente",
    share: "Compartir", noUrl: "Compartir (sin enlace)", withUrl: "Compartir (con enlace)",
    create: "Crear enlace", creating: "Creando enlace…", linkLabel: "Enlace público",
    copyLink: "Copiar enlace", copied: "Copiado", revoke: "Revocar enlace",
    revoking: "Revocando…", expiryLabel: "Caducidad",
    expiryOptions: { never: "Nunca", "7d": "7 días", "30d": "30 días" },
    languageLabel: "Idioma por defecto", languageOptions: [
      { value: "original", label: "Original" }, { value: "es", label: "Español" },
      { value: "en", label: "Inglés" },
    ], close: "Cerrar",
    description: "Crea y administra un enlace público para compartir esta infografía.",
    shareIdle: "El diálogo permite crear un enlace público.",
    shareLinked: "El enlace está disponible y se puede revocar.",
  },
  en: {
    confirm: "Confirmation", title: "Delete infographic",
    warning: "This action cannot be undone.", confirmLabel: "Delete",
    cancel: "Cancel", spinner: "Deleting…", idle: "Idle state",
    pending: "Pending state with a loading indicator.",
    open: "Delete infographic", openPending: "Open pending state",
    share: "Share", noUrl: "Share (without link)", withUrl: "Share (with link)",
    create: "Create link", creating: "Creating link…", linkLabel: "Public link",
    copyLink: "Copy link", copied: "Copied", revoke: "Revoke link",
    revoking: "Revoking…", expiryLabel: "Expiry",
    expiryOptions: { never: "Never", "7d": "7 days", "30d": "30 days" },
    languageLabel: "Default language", languageOptions: [
      { value: "original", label: "Original" }, { value: "es", label: "Spanish" },
      { value: "en", label: "English" },
    ], close: "Close", description: "Create and manage a public link to share this infographic.",
    shareIdle: "The dialog can create a public link.",
    shareLinked: "The link is available and can be revoked.",
  },
};

export function DialogsSection({ locale }: CatalogSectionProps) {
  const c = copy[locale];
  const [confirm, setConfirm] = useState<"closed" | "idle" | "pending">("closed");
  const [shareOpen, setShareOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<ShareExpiry>("never");
  const [language, setLanguage] = useState("original");
  const [status, setStatus] = useState<"idle" | "creating" | "revoking">("idle");
  const labels = {
    title: c.share, description: c.description, create: c.create, creating: c.creating,
    linkLabel: c.linkLabel, copy: c.copyLink, copied: c.copied, revoke: c.revoke,
    revoking: c.revoking, expiryLabel: c.expiryLabel, expiryOptions: c.expiryOptions,
    languageLabel: c.languageLabel, languageOptions: c.languageOptions, close: c.close,
  };
  function create() {
    setStatus("creating");
    window.setTimeout(() => { setUrl("https://example.com/s/abc123"); setStatus("idle"); }, 800);
  }
  function revoke() {
    setStatus("revoking");
    window.setTimeout(() => { setUrl(null); setStatus("idle"); }, 800);
  }
  return (
    <div className={styles.layout}>
      <h3 className="ds-type-title">{c.confirm}</h3>
      <div className={styles.stack}>
        <p className="ds-type-caption">{c.idle}</p>
        <Button onClick={() => setConfirm("idle")}>{c.open}</Button>
        <p className="ds-type-caption">{c.pending}</p>
        <Button variant="outline" onClick={() => setConfirm("pending")}>{c.openPending}</Button>
      </div>
      <ConfirmDialog open={confirm !== "closed"} onClose={() => setConfirm("closed")}
        onConfirm={() => setConfirm("closed")} title={c.title} description={c.warning}
        confirmLabel={c.confirmLabel} cancelLabel={c.cancel}
        status={confirm === "pending" ? "pending" : "idle"} spinnerLabel={c.spinner} />
      <h3 className="ds-type-title">{c.share}</h3>
      <div className={styles.stack}>
        <p className="ds-type-caption">{c.shareIdle}</p>
        <Button
          onClick={() => {
            setUrl(null);
            setShareOpen(true);
            setStatus("idle");
          }}
        >
          {c.noUrl}
        </Button>
        <p className="ds-type-caption">{c.shareLinked}</p>
        <Button
          variant="outline"
          onClick={() => {
            setUrl("https://example.com/s/abc123");
            setShareOpen(true);
            setStatus("idle");
          }}
        >
          {c.withUrl}
        </Button>
      </div>
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} labels={labels}
        url={url} expiry={expiry} onExpiryChange={setExpiry} language={language}
        onLanguageChange={setLanguage} onCreate={create} onRevoke={revoke} status={status} />
    </div>
  );
}
